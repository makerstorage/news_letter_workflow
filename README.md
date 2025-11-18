# news_letter_workflow

claude -p "/news-digest news-sources.txt" --dangerously-skip-permissions

---

## Repository Notes

### Overview
- `Dockerfile` builds a lightweight Node 20 + Playwright image that launches Chromium, blocks heavy resources, and writes a structured JSON crawl result to `/output/result.json`.
- `index.js` accepts `TARGET_URL` (env or CLI) and extracts page title, cleaned text snippet, prominent links, and RSS/Atom feeds before persisting them to `pw-out/<source>/result.json` via a bind mount.
- `news-sources.txt` lists the AI sections we care about (TechCrunch, VentureBeat, MIT Technology Review, etc.) so coordinators can iterate through them and keep output folders organized.
- `pw-out/` contains sample crawl outputs plus an assembled digest (`pw-out/ai-news-digest-2025-11-17.md`) that shows how the JSON data is summarized into a newsletter.

### Running the crawler
1. Build (or rebuild) the Docker image whenever the crawler code changes:
   ```bash
   docker build -t pw-crawler:latest .
   ```
2. Crawl any source by pointing `TARGET_URL` at the page and mounting an output directory:
   ```bash
   docker run --rm \
     -e TARGET_URL="https://techcrunch.com/tag/artificial-intelligence/" \
     -v "$(pwd)/pw-out/techcrunch:/output" \
     pw-crawler:latest
   ```
   Example invocations for each feed are documented in `docker_commands.md`.
3. Inspect the generated `result.json` under the mounted folder to grab headlines, descriptions, and discovered feeds. These files are what the coordinator agent consumes to build the AI digest.

### Sending the newsletter

The newsletter can be automatically emailed to recipients after generation using Claude Code hooks.

#### Email Setup (One-time configuration)

1. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

2. **Get a Gmail App Password:**
   - Visit https://myaccount.google.com/security
   - Enable 2-Step Verification if not already enabled
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and your device
   - Copy the 16-character password (no spaces)

3. **Create your `.env` file:**
   ```bash
   cp .env.example .env
   ```

   Then edit `.env` with your actual values:
   ```env
   EMAIL_USER=your-email@gmail.com
   EMAIL_APP_PASSWORD=your-16-char-app-password
   EMAIL_TO=recipient1@example.com,recipient2@example.com
   EMAIL_FROM="AI News Digest <your-email@gmail.com>"
   ```

#### Automatic Email Sending

Once configured, newsletters are **automatically emailed** when generated via `/news-digest`:

```bash
/news-digest news-sources.txt
```

This triggers:
1. Web crawling of all sources in parallel
2. Newsletter generation (`pw-out/ai-news-digest-YYYY-MM-DD.md`)
3. **Automatic HTML email** to all recipients in `EMAIL_TO`

The automation uses a Claude Code `PostToolUse` hook configured in `.claude/settings.local.json` that detects newsletter file creation and triggers `scripts/send-newsletter.js`.

#### Manual Email Sending

You can also send newsletters manually:

```bash
node scripts/send-newsletter.js pw-out/ai-news-digest-2025-11-17.md
```

This is useful for:
- Reviewing the newsletter before sending
- Re-sending a previously generated newsletter
- Testing email configuration

#### Disabling Automatic Emails

To disable automatic sending (e.g., during testing), comment out the hook in `.claude/settings.local.json`:

```json
{
  "hooks": {
    // "PostToolUse": [...]
  }
}
```

#### Email Features

- **HTML Styling**: Markdown is converted to styled HTML with proper formatting
- **Multiple Recipients**: Supports comma-separated email lists
- **Plain Text Fallback**: Email clients without HTML support get the markdown version
- **Error Handling**: Failed sends are reported with clear error messages

### Automation notes
- `.claude/agents/crawl-single-url.md` describes how the coordinator delegates crawl jobs: validate inputs, ensure the `pw-crawler` image exists, mount `pw-out/<output-name>`, and summarize the resulting JSON for the higher-level workflow.
- Blocking images/media plus a few consent-banner heuristics in `index.js` make crawls faster and more reliable inside headless Chrome, while RSS autodetection captures feeds we can poll separately.

### Monitoring Execution

When running `/news-digest`, you'll see detailed progress information:

#### Verbose Output
The coordinator provides real-time status updates:
- **Source Discovery**: Lists all sources being processed
- **Subagent Launch**: Reports when subagents start in parallel
- **Collection Status**: Shows which sources succeeded/failed
- **Execution Summary**: Final report with metrics including:
  - Total sources processed
  - Success/failure rates per source
  - Articles found per source
  - Newsletter composition stats

#### Token Usage
Token consumption is visible in the Claude Code UI during execution:
- Each subagent consumes tokens independently
- The coordinator agent consumes tokens for orchestration
- Total usage appears in the Claude Code interface
- Use `--dangerously-skip-permissions` to run without interruption

**Example:**
```bash
claude -p "/news-digest news-sources.txt" --dangerously-skip-permissions
```

This will show you:
- Progress through each step
- Subagent execution status
- Final execution summary with all metrics

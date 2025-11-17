---
description: Generates AI news newsletter by orchestrating crawl-single-url subagents in parallel
argument-hint: [sources-file]
---

# Purpose

Coordinate multiple crawl-single-url subagents to process news sources in parallel, then analyze and compile the results into a formatted markdown newsletter. You act as the main coordinator that delegates crawling work to specialized subagents.

## Variables

- **SOURCES_FILE**: $1 (required) - Path to input file containing URLs and output directory names
- **OUTPUT_BASE_DIR**: `pw-out/` - Base directory for crawler outputs
- **TIMESTAMP**: Current date in YYYY-MM-DD format for output filename
- **NEWSLETTER_OUTPUT**: `pw-out/ai-news-digest-{TIMESTAMP}.md`

**Note:** Docker configuration is handled by the crawl-single-url subagent.

## Instructions

**Orchestration Pattern:**
- You are the coordinator agent managing multiple subagents
- Use the Task tool to invoke the `crawl-single-url` subagent for each URL
- Launch all subagents in parallel for maximum efficiency
- After all subagents complete, collect and analyze their results
- Generate a newsletter with the top 5 most important stories

**Key Steps:**
1. Read the sources file to extract URLs and output directory names
2. Clean the output directory
3. Launch multiple Task tool calls in parallel (one per URL) to invoke the crawl-single-url subagent
4. Wait for all subagents to complete
5. Read all result.json files produced by subagents
6. Analyze content to identify important stories (duplicates across sources = important)
7. Generate and save the newsletter

## Workflow

### 1. Validate Input File

- Check if SOURCES_FILE exists
- Parse the file to extract URL and output directory pairs
- Expected format: `URL | output-dir-name` (one per line, # for comments)
- Example:
  ```
  # AI News Sources
  https://techcrunch.com/tag/artificial-intelligence/ | techcrunch
  https://venturebeat.com/category/ai/ | venturebeat
  ```

### 2. Clean Output Directory

Execute this command:
```bash
rm -rf pw-out && mkdir -p pw-out
```

Purpose:
- Delete the entire `pw-out/` directory to remove old crawl results
- This ensures fresh results and prevents mixing old and new data
- Create a fresh `pw-out/` directory

### 3. Prepare for Crawling

**Note:** The crawl-single-url subagent will handle Docker image checking and building automatically. You don't need to manage Docker operations directly - that's the subagent's responsibility.

### 4. Delegate to Subagents in Parallel

For each source in the SOURCES_FILE, delegate to the `crawl-single-url` subagent:

**CRITICAL: Use the Task tool to invoke subagents**
- Send a single message with multiple Task tool calls (one per URL)
- Each Task should invoke the `crawl-single-url` subagent with a clear prompt
- Example prompt format: "Crawl {URL} and save results to output name {output-name}"

**Example of parallel invocation:**
```markdown
Send one message with multiple Task tool uses:
- Task 1: subagent_type="crawl-single-url", prompt="Crawl https://techcrunch.com/tag/ai/ and save to techcrunch"
- Task 2: subagent_type="crawl-single-url", prompt="Crawl https://venturebeat.com/category/ai/ and save to venturebeat"
- Task 3: subagent_type="crawl-single-url", prompt="Crawl https://example.com/ai-news and save to example"
```

**What happens:**
- All subagents run independently and in parallel
- Each subagent handles Docker operations, error handling, and output generation
- Each subagent produces a result.json file in its designated output directory
- Wait for all subagents to complete before proceeding

### 5. Collect Results

- Read all `result.json` files from each output directory
- Extract the following from each source:
  - Page title and status
  - Article snippets
  - Links to articles
  - RSS feed data (if available)
  - Timestamps

### 6. Analyze and Identify Important Stories

- Compare articles across all sources
- Identify duplicate stories (same topic appearing in multiple sources)
- Duplicates indicate important/trending news - prioritize these
- Extract article titles, URLs, and summaries
- Rank stories by:
  1. Coverage across multiple sources (most important)
  2. Recency (publication date)
  3. Relevance to AI/tech industry

### 7. Generate Newsletter

- Select the top 5 most important stories
- For each story, write:
  - Clear headline
  - 2-3 sentence summary
  - Links to all source articles
- Include additional notable stories in a "Bonus" section
- Format using clean markdown with headers and links

### 8. Save Output

- Generate timestamp: `YYYY-MM-DD` format
- Save newsletter as: `{OUTPUT_BASE_DIR}/ai-news-digest-{TIMESTAMP}.md`
- Inform user of the output file location

## Output Format

The generated newsletter should follow this structure:

```markdown
# AI News Digest - YYYY-MM-DD

## 1. [Story Title]

[2-3 sentence summary of the story and its significance]

**Read more:**
- [Source article title](URL) - Source Name
- [Another source if duplicate](URL) - Source Name

---

## 2. [Story Title]

...

---

## Additional Notable Stories

### [Story Title]
[Brief description]

**Read more:**
- [Article title](URL) - Source Name

---

*Newsletter compiled from sources: [list of sources]*
```

## Error Handling

- If a subagent fails to crawl a source, note which source failed but continue with others
- If no result.json is found for a source, skip it and report to user
- If fewer than 5 stories are found, include whatever is available
- Provide a summary of successful vs failed crawls at the end
- Subagents handle their own Docker-related errors independently

## Example Usage

```bash
# Create your sources file first
/news-digest news-sources.txt

# Or use a custom sources file
/news-digest my-custom-sources.txt
```

## Coordinator-Subagent Pattern

This workflow uses a **delegation pattern**:

```
User executes: /news-digest sources.txt
    ↓
Slash command expands to this prompt
    ↓
You (coordinator agent) read this prompt
    ↓
You use Task tool to launch multiple crawl-single-url subagents in parallel
    ↓
Each subagent independently crawls one URL and produces result.json
    ↓
You collect all results and generate the newsletter
```

**Benefits:**
- **Separation of concerns**: Coordinator orchestrates, subagents execute
- **Parallel execution**: Multiple subagents run simultaneously for speed
- **Reusability**: crawl-single-url can be used independently
- **Error isolation**: One subagent failure doesn't crash the entire workflow
- **Maintainability**: Each component can be improved independently

## Notes

- Each crawl-single-url subagent handles all Docker operations independently
- Subagents automatically handle consent banners and cookie dialogs
- Each crawler has a 20-second timeout for page loads
- RSS feeds are auto-detected and fetched when available
- Images, media, and fonts are blocked to speed up crawling
- Subagents report structured results back to you for analysis

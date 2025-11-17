---
description: Generates AI news newsletter by crawling multiple sources in parallel using Docker
argument-hint: [sources-file]
---

# Purpose

Automate the generation of an AI news newsletter by crawling multiple news sources in parallel using Playwright Docker containers, then analyzing and compiling the top stories into a formatted markdown newsletter.

## Variables

- **SOURCES_FILE**: $1 (required) - Path to input file containing URLs and output directory names
- **OUTPUT_BASE_DIR**: `pw-out/` - Base directory for crawler outputs
- **DOCKER_IMAGE**: `pw-crawler:latest` - Docker image name for the Playwright crawler
- **TIMESTAMP**: Current date in YYYY-MM-DD format for output filename
- **NEWSLETTER_OUTPUT**: `pw-out/ai-news-digest-{TIMESTAMP}.md`

## Instructions
- Read the sources file to extract URLs and their corresponding output directories
- Check if the Docker image exists; if not, automatically build it
- Run all Docker crawler commands in parallel for maximum efficiency
- Do not use subagents for the docker execution - use multiple Bash tool calls in parallel
- After all crawlers complete, read all result.json files
- Analyze content to identify important stories (duplicates across sources = important)
- Generate a newsletter with the top 5 most important stories
- Include all article links in the output

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

### 3. Check and Build Docker Image

- Check if image exists: `docker images | grep pw-crawler`
- If image doesn't exist, automatically build it: `docker build -t pw-crawler:latest .`
- Wait for the build to complete before proceeding to crawling

### 4. Run Docker Crawlers in Parallel

For each source in the SOURCES_FILE:
  - Create output directory: `mkdir -p {OUTPUT_BASE_DIR}/{output-dir-name}`
  - Run docker command:
    ```bash
    docker run --rm \
      -e TARGET_URL="{url}" \
      -v "$(pwd)/{OUTPUT_BASE_DIR}/{output-dir-name}:/output" \
      pw-crawler:latest
    ```

**EXECUTION REQUIREMENTS:**
- Use multiple Bash tool calls in a single message to run all docker commands in parallel
- Wait for all containers to complete before proceeding

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

- If Docker build fails, report the error and exit
- If a Docker container fails, note which source failed but continue with others
- If no result.json is found for a source, skip it and report to user
- If fewer than 5 stories are found, include whatever is available

## Example Usage

```bash
# Create your sources file first
/news-digest news-sources.txt

# Or use a custom sources file
/news-digest my-custom-sources.txt
```

## Notes

- The crawler automatically handles consent banners and cookie dialogs
- Each crawler has a 20-second timeout for page loads
- RSS feeds are auto-detected and fetched when available
- Images, media, and fonts are blocked to speed up crawling
- The crawler uses a realistic user agent to avoid detection

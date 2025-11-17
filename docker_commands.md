⚙️ 1. TechCrunch – AI Category
docker run --rm \
  -e TARGET_URL="https://techcrunch.com/tag/artificial-intelligence/" \
  -v "$(pwd)/pw-out/techcrunch:/output" \
  pw-crawler:latest


Covers startup and product launches, funding rounds, and AI industry news.

🧠 2. VentureBeat – AI News
docker run --rm \
  -e TARGET_URL="https://venturebeat.com/category/ai/" \
  -v "$(pwd)/pw-out/venturebeat:/output" \
  pw-crawler:latest


Focuses on enterprise AI, generative-AI research, and company updates.

🤖 3. The Verge – AI Section
docker run --rm \
  -e TARGET_URL="https://www.theverge.com/artificial-intelligence" \
  -v "$(pwd)/pw-out/verge:/output" \
  pw-crawler:latest


Great for mainstream tech + AI ethics, tools, and product news.

💡 4. MIT Technology Review – AI Topic
docker run --rm \
  -e TARGET_URL="https://www.technologyreview.com/topic/artificial-intelligence/" \
  -v "$(pwd)/pw-out/mittechreview:/output" \
  pw-crawler:latest


Covers academic research, policy, and deep-tech AI breakthroughs.

🧬 5. Ars Technica – AI Coverage
docker run --rm \
  -e TARGET_URL="https://arstechnica.com/tag/ai/" \
  -v "$(pwd)/pw-out/arstechnica:/output" \
  pw-crawler:latest
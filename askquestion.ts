const question = process.argv[2];
const maxTokens = Number(process.argv[3] | '200000');

type Page = {
  page_content: string;
  metadata: {
      chunk_size: number;
      document_id: string;
      label: string;
      page: number;
      source: string;
      source_chunk_type: string;
      score: number;
      source_content: string;
      token_count: number;
  };
};

type SearchResponse = {
  sources: Page[];
}

const run = async (search: string, maxTokens: number) => {
  const response = await fetch("http://localhost:8000/semantic/full?question=" + encodeURIComponent(search) + `&max_tokens=${maxTokens}`);
  const result: SearchResponse = await response.json();

  const duplications = new Map<string, Page>();

  result.sources.forEach((page) => {
    if (!duplications.has(page.metadata.source)) {
      duplications.set(page.metadata.source, page);
    }
  });

  const dedupedList: Page[] = [];

  duplications.forEach((value) => {
    dedupedList.push(value);
    console.log(value.metadata.source);
  });

  dedupedList.sort((a, b) => b.metadata.score - a.metadata.score);

  let tokens = 0;

  console.log(`### Instruction:`);
  console.log("Use the following pieces of context to provide detailed answer the question at the end. If answer isn't in the context, say that you don't know, don't try to make up an answer.");
  console.log('### Context:\n\n');

  dedupedList.forEach((page) => {
    tokens += page.metadata.token_count;
    if (tokens < maxTokens) {
      console.log(page.metadata.source_content.trim() + '\n\n');
    }
  });
}

run(question, maxTokens);

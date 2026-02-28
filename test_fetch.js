const fs = require('fs');

async function testFetch() {
  const token = 'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJhZG1pbiIsImlhdCI6MTc3MjI3NjIxMiwiZXhwIjoxNzcyMzYyNjEyfQ.vCGpmjcq7DUgjAgyYEc3nSlaTXGkjb5fj9Zd1woSqDxxMRDA9JtNBsf8HPnQo339IC9OIAXqa1e7MRlhZ48DAg';
  const baseUrl = 'https://spotty-con-ivaniks-3f8c7802.koyeb.app';
  
  const headers = { 'Authorization': `Bearer ${token}` };
  const res = await fetch(`${baseUrl}/orders?page=0&size=1000`, { headers });
  const data = await res.json();
  const totalPages = data.page.totalPages;
  console.log('totalPages:', totalPages);
  
  const promises = [];
  for (let p = 1; p < totalPages; p++) {
    const promise = fetch(`${baseUrl}/orders?page=${p}&size=1000`, { headers })
      .then(r => {
        if (!r.ok) throw new Error(`Status ${r.status}`);
        return r.json();
      });
    promises.push(promise);
  }
  
  try {
    await Promise.all(promises);
    console.log('All fetched successfully');
  } catch(e) {
    console.error('Fetch failed:', e.message);
  }
}

testFetch();

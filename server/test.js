const fs = require('fs');
try {
  const data = fs.readFileSync('test.js', 'utf8');
  console.log("File contents:", data);
} catch (error) {
  console.error("Error reading file:", error);
}
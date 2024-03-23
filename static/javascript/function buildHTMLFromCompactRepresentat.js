
// Append or replace the generated HTML structure to your target element in the DOM
// For example: document.body.appendChild(htmlStructure);

function buildHTMLFromCompactRepresentation(compactRep) {
    // Function to create an element with optional class and placeholder
    function createElement(tag, className, placeholder) {
      const el = document.createElement(tag);
      if (className) el.className = className;
      if (placeholder) el.placeholder = placeholder;
      return el;
    }
  
    // Function to recursively process and append elements from the compact representation
    function appendElementsFromCompactRep(compactString, parentElement) {
      // Regex to match the structure: type[content] and type{...}
      const regex = /(\w+)\[([^\]]+)\]|\w+\s*{/g;
      let match;
  
      while ((match = regex.exec(compactString)) !== null) {
        const [matchedString, type, content] = match;
        if (type && content) {
          // Simple elements (title, label, input)
          switch (type) {
            case 'title':
            case 'label':
              const div = createElement('div', `btn ${type === 'title' ? 'btn-primary btn-tutor-title' : 'btn-success btn-label'} rounded-button`);
              const p = createElement('p', 'page-item');
              p.textContent = content;
              div.appendChild(p);
              parentElement.appendChild(div);
              break;
            case 'input':
              const inputDiv = createElement('div', 'btn btn-light btn-input-box-t rounded-button');
              const input = createElement('input', 'form-control', content);
              input.type = 'text';
              inputDiv.appendChild(input);
              parentElement.appendChild(inputDiv);
              break;
          }
        } else if (matchedString.trim().endsWith('{')) {
          // Nested structures (row, column)
          const elementType = matchedString.trim().replace('{', '').trim();
          const elementDiv = createElement('div', `btn ${elementType === 'row' ? 'btn-warning btn-row' : 'btn-info btn-column'} drop-box rounded-button`);
          const ul = createElement('ul', elementType === 'row' ? 'list one page-item-ul grid grid-flow-col gap-1' : 'list one d-flex flex-column gap-2');
          elementDiv.appendChild(ul);
          parentElement.appendChild(elementDiv);
  
          // Calculate closing brace index
          const closeIndex = findClosingIndex(compactString, regex.lastIndex);
          const innerContent = compactString.substring(regex.lastIndex, closeIndex);
  
          // Recursive call for nested content
          appendElementsFromCompactRep(innerContent, ul);
  
          // Move regex index past processed nested content
          regex.lastIndex = closeIndex + 1;
        }
      }
    }
  
    // Helper function to find the matching closing brace index
    function findClosingIndex(str, openIndex) {
      let stack = 1;
      for (let i = openIndex; i < str.length; i++) {
        if (str[i] === '{') stack++;
        else if (str[i] === '}') stack--;
  
        if (stack === 0) return i;
      }
      return -1; // Not found (shouldn't happen if string is well-formed)
    }
  
    // Initial setup
    const pageDiv = createElement('div', null);
    pageDiv.id = 'page';
    const ul = createElement('ul', 'list one gap-3');
    ul.id = 'page-container';
    pageDiv.appendChild(ul);
  
    // Process the compact representation
    appendElementsFromCompactRep(compactRep, ul);
  
    return pageDiv;
  }
  
  // Example usage
  const compactRep = "title[2 Equations Solver] row {column {label[Equation 1] input[Enter first equation]} column {label[Equation 2] input[Enter second equation]}} row {input[Solve] label[Result]}";
  const htmlStructure = buildHTMLFromCompactRepresentation(compactRep);
  
  // Assuming you have a function or a way to append `htmlStructure` to the DOM
  document.body.appendChild(htmlStructure);
  
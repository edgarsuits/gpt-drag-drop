function compactHTMLRepresentation() {
  // Helper function to process individual elements and return their compact representation
  function processElement(element) {
    let compactRep = '';

    // Process based on class or tag
    if (element.classList.contains('btn-tutor-title')) {
      const title = element.querySelector('p')?.textContent.trim();
      compactRep += `title[${title}] `;
    } else if (element.classList.contains('btn-row')) {
      // Check if there are relevant child elements before adding brackets
      const childElements = element.querySelectorAll(':scope > ul > .btn-column, :scope > ul > .btn-input-box-t, :scope > ul > .btn-label');
      if (childElements.length > 0) {
        compactRep += 'row { ';
        childElements.forEach(child => {
          compactRep += processElement(child);
        });
        compactRep += '} ';
      } else {
        compactRep += 'row ';
      }
    } else if (element.classList.contains('btn-column')) {
      // Check if there are relevant child elements before adding brackets
      const childElements = element.querySelectorAll(':scope > ul > .btn-input-box-t, :scope > ul > .btn-label');
      if (childElements.length > 0) {
        compactRep += 'column { ';
        childElements.forEach(child => {
          compactRep += processElement(child);
        });
        compactRep += '} ';
      } else {
        compactRep += 'column ';
      }
    } else if (element.classList.contains('btn-label')) {
      const label = element.querySelector('p')?.textContent.trim();
      compactRep += `label[${label}] `;
    } else if (element.classList.contains('btn-input-box-t')) {
      const input = element.querySelector('input')?.placeholder || 'Text Box'; // Assuming default placeholder if none is set
      compactRep += `input[${input}] `;
    }

    return compactRep;
  }

  // Start with the first div "page" and first ul which are common and can be skipped
  const pageContainer = document.querySelector('#page-container');
  let representation = '';

  // Iterate over relevant child elements
  pageContainer.querySelectorAll('.btn-tutor-title, .btn-row, .btn-column, .btn-label, .btn-input-box-t').forEach(element => {
    representation += processElement(element);
  });

  return representation.trim();
}

const compactRepresentation = compactHTMLRepresentation();
console.log(compactRepresentation);

function buildRepresentation(element, skipFirstUl = true) {
    let representations = [];

    if (skipFirstUl && element.tagName === 'UL') {
        Array.from(element.children).forEach(child => {
            const childRepresentation = buildRepresentation(child, false);
            if (childRepresentation) {
                representations.push(childRepresentation);
            }
        });
    } else {
        const dataType = element.getAttribute('data-type');
        let childrenRepresentations = [];
        
        if (element.children.length > 0) {
            childrenRepresentations = Array.from(element.children).map(child => buildRepresentation(child, false)).filter(r => r);
        }
        
        let representation = '';
        if (dataType) {
            switch (dataType) {
                case 'page-items':
                    if (element.classList.contains('btn-tutor-title')) representation = 'title';
                    else if (element.classList.contains('btn-input-box-t')) representation = 'textbox';
                    else if (element.classList.contains('btn-fractions')) representation = 'fractions';
                    else if (element.classList.contains('btn-column')) representation = 'column';
                    break;
                case 'page-row':
                    representation = 'row';
                    break;
                case 'page-column':
                    representation = 'column';
                    break;
            }
        }

        if (childrenRepresentations.length > 0) {
            representation += representation ? `{${childrenRepresentations.join(',')}}` : childrenRepresentations.join(',');
        }

        if (representation) {
            representations.push(representation.trim());
        }
    }

    return representations.join(',');
}

const pageElement = document.getElementById('page');
const compactRepresentation = buildRepresentation(pageElement).trim();
console.log(compactRepresentation);

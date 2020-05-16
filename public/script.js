function graphql(query, variables = {}) {       //Liste des fonctions utilisant GraphQL pour manipuler la liste des to-do
  return fetch('/admin/api', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      variables,
      query,
    }),
  }).then(function(result) {  //après avoir récupéré et fetché la réponse, la renvoie via result.json()
    return result.json();
  });
}

const GET_ARTICLES = `
  query GetArticles {
    allArticles {
      title
      summary
      content
      picture {publicUrl}
      journalist {name}
      category {title}
    }
  }
`;

const GET_CATEGORIES = `
  query GetCategories {
    allCategories {
      title
    }
  }
`;

// const ADD_CATEGORY = `
//     mutation AddCategory($title: String!) {
//       createCategory(data: { title: $title}) {
//         title
//         id
//       }
//     }
//   `;


// //Mutation pour créer un article et l'ajouter
// const ADD_ARTICLE = `
//     mutation AddArticle($title: String!) {
//       createArticle(data: { title: $title }) {
//         title
//         id
//       }
//     }
//   `;

// const REMOVE_ARTICLE = `
//     mutation RemoveArticle($id: ID!) {
//       deleteArticle(id: $id) {
//         title
//         id
//       }
//     }
//   `;

// const DELETE_ICON = `<svg viewBox="0 0 14 16" class="delete-icon">
//   <title>Delete this item</title>
//   <path
//     fillRule="evenodd"
//     d="M11 2H9c0-.55-.45-1-1-1H5c-.55 0-1 .45-1 1H2c-.55 0-1 .45-1 1v1c0 .55.45 1 1 1v9c0 .55.45 1 1 1h7c.55 0 1-.45 1-1V5c.55 0 1-.45 1-1V3c0-.55-.45-1-1-1zm-1 12H3V5h1v8h1V5h1v8h1V5h1v8h1V5h1v9zm1-10H2V3h9v1z"
//   />
// </svg>`;

function addArticle(event) {
  event.preventDefault();
  const form = event.target;
  // Find the 'add-item' input element
  const element = form.elements['add-item'];
  if (element) {
    graphql(ADD_ARTICLE, { name: element.value }).then(fetchData);
  }
  // Clear the form
  form.reset();
}

function removeArticle(article) {
  graphql(REMOVE_ARTICLE, { id: article.id }).then(fetchData);
}

function addCategory(event) {
  event.preventDefault();
  const form = event.target;
  const element = form.elements['add-item'];
  if (element) {
    graphql(ADD_CATEGORY, { name: element.value }).then(fetchData);
  }
  form.reset();
}

function removeCategory(category) {
  graphql(REMOVE_CATEGORY, { id: category.id }).then(fetchData);
}

function createArticleItem(article) {
  // Create the remove button
  const removeItemButton = document.createElement('button');
  removeItemButton.classList.add('remove-item', 'js-remove-article-button');
  removeItemButton.innerHTML = DELETE_ICON;
  removeItemButton.addEventListener('click', function() {
    removeArticle(article);
  });

  // Create the list item
  const listItem = document.createElement('li');
  listItem.classList.add('list-item');
  listItem.innerHTML = article.title;
  // append the remove item button
  listItem.appendChild(removeItemButton);

  return listItem;
}

function createArticleList(data) {
  // Create the list
  const list = document.createElement('ul');
  list.classList.add('list-articles');
  data.allArticles.forEach(function(article) {
    list.appendChild(createMovieItem(article));
  });
  return list;
}

function fetchData() {
  graphql(GET_ARTICLES)
    .then(function(result) {
      document.querySelector('.results-article').innerHTML = '';
      const articlesList = createArticlesList(result.data);
      document.querySelector('.results-article').appendChild(articlesList);
    })
    .catch(function(error) {
      console.log(error);
      document.querySelector('.results-article').innerHTML = '<p>Error</p>';
    });

  graphql(GET_CATEGORIES)
    .then(function(result) {
      document.querySelector('.results-category').innerHTML = '';
      const list = createList(result.data);
      document.querySelector('.results-category').appendChild(list);
    })
    .catch(function(error) {
      console.log(error);
      document.querySelector('.results-category').innerHTML = '<p>Error</p>';
    });
}

// Replace the script tag with the app
document.getElementById('article-app').parentNode.innerHTML = `
<div class="app">
  <h1 class="main-heading">Welcome to Article-APP &nbsp;5!</h1>
  <hr class="divider" />
  <div class="form-wrapper">
    <h2 class="app-heading">Article List</h2>
    <div>
      <form class="js-add-article-form">
        <input required name="add-item" placeholder="Ajouter un nouvel article" class="form-input add-item" />
      </form>
    </div>
    <div class="results">
      <p>Loading...</p>
    </div>
  </div>
</div>`;

// Add event listener to the form
document.querySelector('.js-add-article-form').addEventListener('submit', addArticle);  //Ajoute un event au formulaire ('.js-add-article-form) html déclenchant 'addArticle'
// Fetch the initial data
fetchData();

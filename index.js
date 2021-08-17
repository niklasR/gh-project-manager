const { paginateRest } = require("@octokit/plugin-paginate-rest");
const { Octokit } = require("@octokit/core");

const { promises: fs } = require('fs');

const OctokitWithPlugin = Octokit.plugin(paginateRest);
const octokit = new OctokitWithPlugin({ auth: process.env.GITHUB_TOKEN });

const EXPORT_PATH = 'PROJECT'
const PROJECT_ID = process.env.GITHUB_PROJECT_ID;

async function getColumnsWithCards() {
  const columns = await octokit.paginate('GET /projects/{project_id}/columns', {
    project_id: PROJECT_ID,
    mediaType: {
      previews: [
        'inertia'
      ]
    }
  });

  const columnsWithCards = await Promise.all(columns.map(async ({ id: columnId, name: columnName }) => {
    const cards = await octokit.paginate('GET /projects/columns/{column_id}/cards', {
      column_id: columnId,
      mediaType: {
        previews: [
          'inertia'
        ]
      }
    });
    return {
      id: columnId,
      name: columnName,
      cards
    };
  }));
  return columnsWithCards;
}

async function syncDown() {
  const columnsWithCards = await getColumnsWithCards();

  for (const column of columnsWithCards) {
    const columnPath = `${EXPORT_PATH}/${column.name}`;

    await fs.mkdir(columnPath, { recursive: true });
    for (const card of column.cards) {
      await fs.writeFile(`${columnPath}/${card.id}.md`, card.note);
    }
  }
}

async function getLocalNote(columnName, cardId) {
  const columnPath = `${EXPORT_PATH}/${columnName}`;
  
  try {
    const localNote = await fs.readFile(`${columnPath}/${cardId}.md`);
    return {
      localNote,
      newColumn: columnName
    };
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    throw new Error('File not found - Moving columns is not currently supported.');
  }
}


async function syncUp() {
  const columnsWithCards = await getColumnsWithCards();

  for (const column of columnsWithCards) {
    for (const card of column.cards) {
      const { localNote, newColumn } = getLocalNote(column.name, card.id).toString();
      if (localNote !== card.note) {

        console.log(`Updating card ${card.id}`);
        await octokit.request('PATCH /projects/columns/cards/{card_id}', {
          card_id: card.id,
          note: localNote,
          mediaType: {
            previews: [
              'inertia'
            ]
          }
        });
      }
    }
  }
}

syncUp().then(console.log).catch(console.log)

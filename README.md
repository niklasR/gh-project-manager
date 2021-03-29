# GH Project Manager

The github project UI requires loads of clicks to edit note cards. You can

This project pulls down copies of the cards' note contents, stores it in local markdown files for easier editing, and uploads them again when so desired.

USE AT OWN RISK - risk of overwriting data.

### Use
- Set `GITHUB_PROJECT_ID` and `GITHUB_TOKEN` env variables
- Update the index.js to either call the syncDown or syncUp function
- Run it
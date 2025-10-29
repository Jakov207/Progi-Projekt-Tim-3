const express = require('express');
const app = express();


//pali server na portu 8080
app.listen(8080, () => {
    console.log('Server started on http://localhost:8080');
});
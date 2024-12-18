const express = require('express');
const app = express();
const api = require('./api');

app.use(express.json());
app.use('/api', api);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});


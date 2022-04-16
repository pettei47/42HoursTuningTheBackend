const express = require('express')
const app = express();

app.use(express.json({limit: '10mb'}))

const api = require("./api");
const api2 = require("./api2")

app.get('/api/hello', (req, res) => {
  console.log('requested');
  res.send({ response :'World!'})
})

app.post('/api/client/records', async (req, res, next) => {
  try {
    await api.postRecords(req, res);
  } catch(e) {
    console.log(e);
    next(new Error("Unexpect"));
  }
})

app.get('/api/client/records/:recordId', async (req, res, next) => {
  try {
    await api.getRecord(req, res);
  } catch(e) {
    console.log(e);
    next(new Error("Unexpect"));
  }
})

app.get('/api/client/record-views/tomeActive', async (req, res, next) => {
  try {
    await api2.tomeActive(req, res);
  } catch(e) {
    console.log(e);
    next(new Error("Unexpect"));
  }
})

app.get('/api/client/record-views/allActive', async (req, res, next) => {
  try {
    await api2.allActive(req, res);
  } catch(e) {
    console.log(e);
    next(new Error("Unexpect"));
  }
})

app.get('/api/client/record-views/allClosed', async (req, res, next) => {
  try {
    await api2.allClosed(req, res);
  } catch(e) {
    console.log(e);
    next(new Error("Unexpect"));
  }
})

app.get('/api/client/record-views/mineActive', async (req, res, next) => {
  try {
    await api2.mineActive(req, res);
  } catch(e) {
    console.log(e);
    next(new Error("Unexpect"));
  }
})

app.put('/api/client/records/:recordId', async (req, res, next) => {
  try {
    await api.updateRecord(req, res);
  } catch(e) {
    console.log(e);
    next(new Error("Unexpect"));
  }
})

app.get('/api/client/records/:recordId/comments', async (req, res, next) => {
  try {
    await api.getComments(req, res);
  } catch(e) {
    console.log(e);
    next(new Error("Unexpect"));
  }
})

app.post('/api/client/records/:recordId/comments', async (req, res, next) => {
  try {
    await api.postComments(req, res);
  } catch(e) {
    console.log(e);
    next(new Error("Unexpect"));
  }
})

app.get('/api/client/categories', async (req, res, next) => {
  try {
    await api.getCategories(req, res);
  } catch(e) {
    console.log(e);
    next(new Error("Unexpect"));
  }
})

app.post('/api/client/files', async (req, res, next) => {
  try {
    await api.postFiles(req, res);
  } catch(e) {
    console.log(e);
    next(new Error("Unexpect"));
  }
})

app.get('/api/client/records/:recordId/files/:itemId', async (req, res, next) => {
  try {
    await api.getRecordItemFile(req, res);
  } catch(e) {
    console.log(e);
    next(new Error("Unexpect"));
  }
})

app.get('/api/client/records/:recordId/files/:itemId/thumbnail', async (req, res, next) => {
  try {
    await api.getRecordItemFileThumbnail(req, res);
  } catch(e) {
    console.log(e);
    next(new Error("Unexpect"));
  }
})


app.listen(8000, () => console.log('listening on port 8000...'))

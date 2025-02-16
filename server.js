const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = 3000;
const ADDRESS = 'localhost';


const baseDir = path.join(__dirname, 'files');

app.use(express.static(path.join(__dirname, 'public')));

app.use('/files', express.static(path.join(__dirname, 'files')));

app.get('/api/getFolders', (req, res) => {
  fs.readdir(baseDir, (err, items) => {
    if (err) {
      return res.status(500).json({ error: 'Cant read dir: files' });
    }
    const folders = items.filter(item => {
      const itemPath = path.join(baseDir, item);
      return fs.statSync(itemPath).isDirectory();
    });
    res.json({ folders });
  });
});

app.get('/api/getFiles', (req, res) => {
  const folder = req.query.folder;
  if (!folder) {
    return res.status(400).json({ error: 'folder is not selected yet' });
  }

  const safeFolder = path.basename(folder);
  const targetDir = path.join(baseDir, safeFolder);

  if (!targetDir.startsWith(baseDir)) {
    return res.status(400).json({ error: 'Wrong dir' });
  }

  fs.stat(targetDir, (err, stats) => {
    if (err || !stats.isDirectory()) {
      return res.status(404).json({ error: 'Dir not found' });
    }

    fs.readdir(targetDir, (err, items) => {
      if (err) {
        return res.status(500).json({ error: 'Cant read dir' });
      }
      const files = items.filter(item => {
        return fs.statSync(path.join(targetDir, item)).isFile();
      });
      res.json({ files });
    });
  });
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const folder = req.query.folder;
    if (!folder) {
      return cb(new Error('Dir is not selected'));
    }
    const safeFolder = path.basename(folder);
    const targetDir = path.join(baseDir, safeFolder);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    cb(null, targetDir);
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});
const upload = multer({ storage });

app.post('/api/upload', upload.single('file'), (req, res) => {
  res.json({ message: 'Success upload!' });
});

app.delete('/api/deleteFile', (req, res) => {
  const folder = req.query.folder;
  const fileName = req.query.file;
  if (!folder || !fileName) {
    return res.status(400).json({ error: 'folder or file not selected' });
  }
  const safeFolder = path.basename(folder);
  const safeFile = path.basename(fileName);
  const filePath = path.join(baseDir, safeFolder, safeFile);
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      return res.status(404).json({ error: 'File not found' });
    }
    fs.unlink(filePath, err => {
      if (err) {
        return res.status(500).json({ error: 'Cant delete file' });
      }
      res.json({ message: 'Success delete!' });
    });
  });
});

app.listen(PORT, () => {
  console.log(`Server run on http://${ADDRESS}:${PORT}`);
});

/*eslint-disable*/
var router = require('express').Router();
var multer = require('multer');
var unzip = require('unzip');
var fs = require('fs');
var auth = require('../auth');
const path = require('path');
var dirPath = './uploads/';
var destPath = '';

let storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, dirPath);
  },
  filename: (req, file, cb) => {
    destPath = file.fieldname + '-' + Date.now() + '.' + path.extname(file.originalname);
    cb(null, destPath);
  }
});
let upload = multer({ storage: storage });

router.get('/', auth.optional, function (req, res) {
  res.end('file catcher example');
});

router.post('/', upload.single('file'), function (req, res) {
  if (!req.file) {
    console.log("No file received");
    return res.send({
      success: false
    });

  } else {
    console.log('file received');
    if (req.file.mimetype == 'application/zip') {
      fs.createReadStream(dirPath + destPath).pipe(unzip.Extract({ path: dirPath }));
      console.log('file extracted');
      return res.send({
        success: true
      });
    }

    console.error('Bad file Format : ' + req.file.mimetype + '\nExpected .zip');
    return res.status(422).json({ errors: { file: "must be an .zip archive" } });

  }

});

module.exports = router;

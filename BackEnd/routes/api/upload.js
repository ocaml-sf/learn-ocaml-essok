/*eslint-disable*/
var router = require('express').Router();
var multer = require('multer');
var auth = require('../auth');
const path = require('path');
var DIR = './uploads/';

let storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, DIR);
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + '-' + Date.now() + '.' + path.extname(file.originalname));
  }
});
let upload = multer({storage: storage});

router.get('/', auth.optional, function (req, res) {
  res.end('file catcher example');
});

router.post('/',upload.single('file'), function (req, res) {
  if (!req.file) {
      console.log("No file received");
      return res.send({
        success: false
      });
  
    } else {
      console.log('file received');
      return res.send({
        success: true
      })
    }
});

module.exports = router;

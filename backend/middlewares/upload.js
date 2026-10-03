const multer = require('multer');
const path = require('path');
const fs = require('fs');

const makeStorage = (dest) => multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'uploads', dest);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, Date.now() + '-' + Math.round(Math.random()*1e9) + path.extname(file.originalname))
});

const fileFilter = (req, file, cb) => {
  if (/jpeg|jpg|png|pdf/.test(path.extname(file.originalname).toLowerCase())) return cb(null, true);
  cb(new Error('Only JPEG, PNG, PDF allowed'));
};

const uploadDocuments = multer({ storage: makeStorage('documents'), limits: { fileSize: 5*1024*1024 }, fileFilter });
const uploadPhoto = multer({ storage: makeStorage('photos'), limits: { fileSize: 2*1024*1024 }, fileFilter });

module.exports = { uploadDocuments, uploadPhoto };

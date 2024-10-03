const multer = require('multer');
const path = require('path');

const upload = multer({
   dest: path.join(__dirname, '..', 'public', 'uploads'),
   storage:multer.diskStorage({
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    },
    destination: path.join(__dirname, '..', 'public', 'uploads'),
   }) 
})

const upload_Profile = multer({
   dest: path.join(__dirname, '..', 'public', 'profiles'),
   storage:multer.diskStorage({
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    },
    destination: path.join(__dirname, '..', 'public', 'profiles'),
   }) 
})
const upload_Contract = multer({
   dest: path.join(__dirname, '..', 'public', 'contract'),
   storage:multer.diskStorage({
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    },
    destination: path.join(__dirname, '..', 'public', 'contract'),
   }) 
})
const upload_ProofOfService = multer({
   dest: path.join(__dirname, '..', 'public', 'proofOfService'),
   storage:multer.diskStorage({
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    },
    destination: path.join(__dirname, '..', 'public', 'proofOfService'),
   }) 
})
const upload_InventoryBill = multer({
   dest: path.join(__dirname, '..', 'public', 'inventoryBill'),
   storage:multer.diskStorage({
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    },
    destination: path.join(__dirname, '..', 'public', 'inventoryBill'),
   }) 
})

const upload_IdPhoto = multer({
   dest: path.join(__dirname, '..', 'public', 'idPhoto'),
   storage:multer.diskStorage({
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    },
    destination: path.join(__dirname, '..', 'public', 'idPhoto'),
   }) 
})

const upload_InventoryPhoto = multer({
   dest: path.join(__dirname, '..', 'public', 'idPhoto'),
   storage:multer.diskStorage({
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    },
    destination: path.join(__dirname, '..', 'public', 'idPhoto'),
   }) 
})


module.exports = { upload, upload_Profile, upload_Contract, upload_ProofOfService, upload_InventoryBill, upload_IdPhoto, upload_InventoryPhoto};
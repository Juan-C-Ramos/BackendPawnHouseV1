const { getAll, create, remove } = require('../controllers/proofOfService.controller');
const express = require('express');
const { upload_ProofOfService } = require('../utils/multer');

const routerProofOfService = express.Router();

routerProofOfService.route('/')
    .get(getAll)
    .post(upload_ProofOfService.single('image'), create);
    
    



    routerProofOfService.route('/:id')
    //.get(getOne)
    .delete(remove)
    //.put(update);
    

module.exports = routerProofOfService;
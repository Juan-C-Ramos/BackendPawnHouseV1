const catchError = require('../utils/catchError');
const User = require('../models/User.js');
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken');
const ProfilePhoto = require('../models/ProfilPhoto.js');
const Customer = require('../models/Customer.js');
const Transaction = require('../models/Transaction.js');
const Inventory = require('../models/Inventory.js');
const LoginRegister = require('../models/LoginRegister');


const getAll = catchError(async (req, res) => {
  const results = await User.findAll({include: [ProfilePhoto]});
  return res.json(results);
});

const create = catchError(async (req, res) => {


  const { password } = req.body
  const hashedPassword = await bcrypt.hash(password, 10)

  //console.log(`contrasena sin encriptar: ${password}`);
  //console.log(`password encriptada: ${hashedPassword}`);


  const body = { ...req.body, password: hashedPassword }
  const result = await User.create(body);

  return res.status(201).json(result);
});

const getOne = catchError(async (req, res) => {
  const { id } = req.params;
  const result = await User.findByPk(id, {include: [ProfilePhoto, Customer, LoginRegister,
    {
        model: Transaction,
        as: 'transactions',
        include: [Customer, Inventory]
      
  }
]
});
  if (!result) return res.sendStatus(404);
  return res.json(result);
});

const remove = catchError(async (req, res) => {
  const { id } = req.params;
  const result = await User.destroy({ where: { id } });
  if (!result) return res.sendStatus(404);
  return res.sendStatus(204);
});


const update = catchError(async (req, res) => {
  const { id } = req.params;

  // Evitar que cambien el email
  delete req.body.email;

  // 🔐 Si viene password, la encriptamos
  if (req.body.password) {
    req.body.password = await bcrypt.hash(req.body.password, 10);
  }

  const result = await User.update(
    req.body,
    { where: { id }, returning: true }
  );

  if (result[0] === 0) return res.sendStatus(404);

  return res.json(result[1][0]);
});
const login = catchError(async (req, res) => { //! -> /users/login



    //const crypto = require('crypto');
    //const secretKey = crypto.randomBytes(64).toString('hex');
    //console.log(secretKey);
    
  const { userName, password, dispositivo, locationLat, locationLong } = req.body

  
  const user = await User.findOne({ where: { userName } })
  if (!user) return res.status(401).json({ error: 'Invalid credentials' })

  const isValid = await bcrypt.compare(password, user.password)
  if (!isValid) return res.status(401).json({ error: 'Invalid credentials' })

  //!JWT

  const token = jwt.sign(
    { user },
    process.env.TOKEN_SECRET,
    { expiresIn: '1d' }
  )

  const loginRegister = {
    dispositivo: dispositivo,
    locationLat: locationLat,
    locationLong: locationLong,
    browser: req.headers['user-agent'],
    idUser: user.id,
    ipAddress: req.ip,
  }
  const result = await LoginRegister.create(loginRegister);

  await user.setLoginRegisters(result.id)


  return res.json({ user, token })

})

const logged = catchError(async (req, res) => {
  const id = req.user.id
  const user = await User.findByPk(id, {include: [ProfilePhoto, Customer, Transaction]});
  return res.json(user)
})

const setImage = catchError(async(req, res) => {
  const { id } = req.params;
  const user = await User.findByPk(id);
  if(!user) return res.sendStatus(404);

  await user.setProfilePhotos(req.body)
  const images = await user.getProfilePhotos();

  return res.status(200).json(images);
});

module.exports = {
  getAll,
  create,
  getOne,
  remove,
  update,
  login,
  logged,
  setImage
}
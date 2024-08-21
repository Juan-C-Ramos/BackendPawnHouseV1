const catchError = require('../utils/catchError');
const User = require('../models/User.js');
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const getAll = catchError(async (req, res) => {
  const results = await User.findAll();
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
  const result = await User.findByPk(id);
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

  delete req.body.password
  delete req.body.email

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
    
  const { userName, password } = req.body

  console.log(userName, password);

  const user = await User.findOne({ where: { userName } })
  if (!user) return res.status(401).json({ error: 'Invalid credentials' })

  const isValid = await bcrypt.compare(password, user.password)
  if (!isValid) return res.status(401).json({ error: 'Invalid credentials' })

  //!JWT

  const token = jwt.sign(
    { user },
    process.env.TOKEN_SECRET,
    { expiresIn: '100d' }
  )

  return res.json({ user, token })

})

const logged = catchError(async (req, res) => {
  const user = req.user
  return res.json(user)
})

module.exports = {
  getAll,
  create,
  getOne,
  remove,
  update,
  login,
  logged
}
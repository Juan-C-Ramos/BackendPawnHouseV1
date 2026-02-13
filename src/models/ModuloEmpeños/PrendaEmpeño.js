const { DataTypes } = require('sequelize');
const sequelize = require('../../utils/connection');

const PrendaEmpeno = sequelize.define('prendaEmpeno', {
    nombre: {
        type: DataTypes.STRING,
        allowNull: false
    },
    descripcion: {
        type: DataTypes.STRING,  // si es joyeria, incluir detalles como tipo de joya, piedras preciosas, etc.(si es otro tipo de prenda, el frontend puede guiar al usuario para que ingrese una descripción adecuada incluyendo características relevantes)
        allowNull: false
    },
    valorEstimado: {
        type: DataTypes.DECIMAL(10, 2),  //valor que esta disuesto a prestar basado en la prenda
        allowNull: false
    },
    categoria: {
        type: DataTypes.STRING, // Ejemplo: "Joyería", "Electrónica", "Electrodomésticos", "Vehículos", etc.
        allowNull: false
    },
    kilateje: {
        type: DataTypes.DECIMAL(5, 2),  // solo si es joyeria
        allowNull: true
    },
    pesoGramos: {
        type: DataTypes.DECIMAL(10, 2), // solo si es joyeria
        allowNull: true
    },
    facturaOriginalNumero: {
        type: DataTypes.STRING,  // numero de la factura original si aplica
        allowNull: true
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'GUARDADO'
    },
    urlFotoPrenda: {
        type: DataTypes.STRING,  // URL o ruta de la foto de la prenda
        allowNull: true
    },
    urlFotofactura: {
        type: DataTypes.STRING, // url o ruta de la foto de la factura original
        allowNull: true
    },

    //Relaciones

    contratoEmpenoId: {
  type: DataTypes.INTEGER,
  allowNull: false
},

//relaciones
contratoEmpenoId: {
  type: DataTypes.INTEGER,
  allowNull: false
},
userId: {
  type: DataTypes.INTEGER,
  allowNull: false
},
customerId: {
  type: DataTypes.INTEGER,
  allowNull: false
}


});

module.exports = PrendaEmpeno;
const { Model, DataTypes } = require('sequelize');
const sequelize = require('../../db/sequelize');

class Categoria extends Model {}

Categoria.init({
    id_categoria: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    nombre: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    descripcion: {
        type: DataTypes.TEXT,
    }
}, {
    sequelize,
    modelName: 'categoria',
    tableName: 'categoria',  // Asegúrate de que el nombre coincida con el de la tabla
    timestamps: false, // Opcional, si no usas createdAt y updatedAt
});

module.exports = Categoria;

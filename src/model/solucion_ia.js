const { Model, DataTypes } = require('sequelize');
const sequelize = require('../../db/sequelize');
const Categoria = require('./categoria');  // Asegúrate de que la ruta sea correcta

class Solucion_ia extends Model {}

Solucion_ia.init({
    id_solucion: {
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
    },
    precio: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    id_categoria: {
        type: DataTypes.INTEGER,
        references: {
            model: Categoria,
            key: 'id_categoria',
        }
    },
    modelo_negocio: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'Free', // Por defecto es 'Free'
    },
    pagina_web: {
        type: DataTypes.STRING,
        allowNull: true,
    },
}, {
    sequelize,
    modelName: 'solucion_ia',
    tableName: 'solucion_ia',  
    timestamps: false, // Si no usas createdAt y updatedAt
});

// Establecer la relación entre 'Solucion_ia' y 'Categoria'
Solucion_ia.belongsTo(Categoria, { foreignKey: 'id_categoria', as: 'categoria' });

module.exports = Solucion_ia;

const { Model, DataTypes } = require('sequelize');
const sequelize = require('../../db/sequelize');
const Usuario = require('./usuario');
const Solucion_ia = require('./solucion_ia');

class Favorito extends Model {}

Favorito.init({
    id_favorito: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    id_usuario: {
        type: DataTypes.INTEGER,
        references: {
            model: Usuario,
            key: 'id_usuario',
        },
        allowNull: false,
    },
    id_solucion: {
        type: DataTypes.INTEGER,
        references: {
            model: Solucion_ia,
            key: 'id_solucion',
        },
        allowNull: false,
    },
    fecha: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
}, {
    sequelize,
    modelName: 'favorito',
    tableName: 'favorito',
    timestamps: false,
});

// Relaciones
Favorito.belongsTo(Usuario, { foreignKey: 'id_usuario', as: 'usuario' });
Favorito.belongsTo(Solucion_ia, { foreignKey: 'id_solucion', as: 'solucion' });

module.exports = Favorito;

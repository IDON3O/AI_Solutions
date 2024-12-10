const { Model, DataTypes } = require('sequelize');
const sequelize = require('../../db/sequelize');
const Usuario = require('./usuario');
const Solucion_ia = require('./solucion_ia');

class Calificacion extends Model {}

Calificacion.init({
    id_calificacion: {
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
    calificacion: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 1,
            max: 5,
        },
    },
    comentario: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    fecha: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
}, {
    sequelize,
    modelName: 'calificacion',
    tableName: 'calificacion',
    timestamps: false,
});

// Relaciones
Calificacion.belongsTo(Usuario, { foreignKey: 'id_usuario', as: 'usuario' });
Calificacion.belongsTo(Solucion_ia, { foreignKey: 'id_solucion', as: 'solucion' });

module.exports = Calificacion;

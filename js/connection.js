var jt400 = require('jt400'),
    connection = {
        connect: function(options) {
            console.log('connecting...');
            jt400.configure(options);
            return jt400.query('SELECT * FROM SYSIBM.SYSDUMMY1').then(function(res) {
                console.log('connected!!');
                return true;
            });
        },
        execute: function(sqlStatement) {
            return jt400.executeQuery(sqlStatement);
        }
    };



module.exports = connection;
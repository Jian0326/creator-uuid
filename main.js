'use strict';

module.exports = {
    load() {
        // execute when package loaded
    },

    unload() {
        // execute when package unloaded
    },

    // register your ipc messages here
    messages: {
        'open'() {
            // open entry panel registered in package.json
            Editor.Panel.open( 'uuid' );
            Editor.log( '输入资源UUID查看正在使用的资源' );
        },
        'clicked'() {
            Editor.log( 'Button clicked!' );
        }
    },
};
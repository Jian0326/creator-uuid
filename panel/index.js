// panel/index.js, this filename needs to match the one registered in package.json
const Fs = require( 'fire-fs' );
//creator 支持的文件类型  论坛提供方的api列表 https://forum.cocos.org/t/creator-api/92605
// { 'cc.Asset': 'native-asset',
//     'cc.AnimationClip': 'animation-clip',
//     'cc.AudioClip': 'audio-clip',
//     'cc.BitmapFont': 'bitmap-font',
//     'cc.CoffeeScript': 'coffeescript',
//     'cc.TypeScript': 'typescript',
//     'cc.JavaScript': 'javascript',
//     'cc.JsonAsset': 'json',
//     'cc.ParticleAsset': 'particle',
//     'cc.Prefab': 'prefab',
//     'cc.SceneAsset': 'scene',
//     'cc.SpriteAtlas': 'texture-packer',
//     'cc.SpriteFrame': 'sprite-frame',
//     'cc.Texture2D': 'texture',
//     'cc.TTFFont': 'ttf-font',
//     'cc.TextAsset': 'text',
//     'cc.LabelAtlas': 'label-atlas',
//     'cc.RawAsset': 'raw-asset',
//     'cc.Script': 'script',
//     'cc.Font': 'font',
//     'sp.SkeletonData': 'spine',
//     'cc.TiledMapAsset': 'tiled-map',
//     'dragonBones.DragonBonesAsset': 'dragonbones',
//     'dragonBones.DragonBonesAtlasAsset': 'dragonbones-atlas' },

Editor.Panel.extend( {
    // css style for panel
    style: `
    :host { margin: 5px; }
    h2 { color: #f90; }
  `,

    // html template for panel
    template: `
    <h2>UUID</h2>
    <hr />
    <ui-input class="flex-2" id="uuidInput" tabindex="-1" placeholder="输入UUID" v-value="uuid" v-on:blur="onCheckUUID"></ui-input>
    <hr />
    <ui-input class="flex-2" id="pathInput" v-value="scriptUrl" "tabindex="-1" placeholder="输入脚本文件路径" v-value="scriptPath" ></ui-input>
    <ui-button class="small" tabindex="-1"  v-on:confirm="onSelectJSPath">选择js目录</ui-button>
    <ui-button class="small" tabindex="-1"  v-on:confirm="onSelectSFPath">选择sf目录</ui-button>
    <hr />
    <ui-button id="btn" v-on:confirm="onFindUUID" >查找</ui-button>
    <hr />
    <div>提示： <span id="label">
    现在支持查找脚本文件和纹理文件在下吗那些预制文件有使用；
    暂时无法查找纹理绑定在脚本上的哦，以及字体文件；
    查找的路径是写在脚本里面的；
    </span></div>
  `,

    // element and variable binding
    $: {
        btn   : '#btn',
        label : '#label',
        input1: "#uuidInput",
        input2: "#pathInput",
    },

    // method executed when template and styles are successfully loaded and initialized
    ready() {
        window.plugin = new window.Vue( {
            el     : this.shadowRoot,
            created() {
                Editor.log( "成功初始化" );
            },
            data   : {
                uuid     : "bae4f6b4-7d1e-4612-99b7-ab5239576cc1",
                scriptUrl: "",
                uuidObj  : {},
                isFind   : false,
            },
            methods: {

                _setOpenUrl() {
                    let path  = Editor.url( 'db://assets' );
                    let files = Editor.Dialog.openFile( {
                        defaultPath: path,
                        properties : [ 'openDirectory' ]
                    } );
                    if ( files ) {
                        path = files[0];
                    }
                    this.scriptUrl = path;
                },
                onSelectJSPath() {
                    this._setOpenUrl();
                    let assetUrl = Editor.remote.assetdb.fspathToUrl( this.scriptUrl );
                    if ( this.scriptUrl === assetUrl ) {
                        Editor.warn( "请选择项目目录哦" );
                        return;
                    }
                    this._analyzeUUIDInfo( assetUrl, "javascript" );
                },

                onSelectSFPath() {
                    this._setOpenUrl();
                    let assetUrl = Editor.remote.assetdb.fspathToUrl( this.scriptUrl );
                    if ( this.scriptUrl === assetUrl ) {
                        Editor.warn( "请选择项目目录哦" );
                        return;
                    }
                    this._analyzeUUIDInfo( assetUrl, "sprite-frame" );
                },

                _analyzeUUIDInfo( url, type ) {
                    let self = this;
                    self.uuidObj = {};
                    Editor.assetdb.queryAssets( url + "/**/*", type, function ( err, results ) {
                        if ( err ) return;
                        let len = results.length;
                        for ( let i = 0; i < len; i++ ) {
                            let uuid = results[i].uuid;
                            if ( type === "javascript" ) uuid = Editor.Utils.UuidUtils.compressUuid( results[i].uuid );
                            self.uuidObj[uuid] = results[i];
                        }
                    } );
                },
                onCheckUUID() {
                    Editor.log( 'check uuid', this.uuid );
                },
                onFindUUID() {
                    // Editor.assetdb.queryUuidByUrl( url, function ( err, uuid ) {
                    //     Editor.log( "uuid", uuid );
                    // } );
                    if ( this.isFind ) {
                        Editor.log( "正在查找中........." );
                        return;
                    }
                    this.isFind = true;
                    let self    = this;
                    let objs    = Object.values( this.uuidObj );
                    if ( objs.length > 0 ) {
                        this._findInfo( objs[0].type, this.uuidObj );
                        return;
                    }
                    if ( !this._isUUID() ) {
                        Editor.log( "uuid 无效" );
                        return;
                    }
                    let url = Editor.remote.assetdb.uuidToUrl( this.uuid );
                    Editor.log( "开始查找！！！！！！！", this.uuid, url );
                    Editor.assetdb.queryInfoByUuid( this.uuid, function ( err, info ) {
                        Editor.log( "当前查找的文件信息", info, self.uuid );
                        if ( err ) return;
                        self._findInfo( info.type );
                    } );
                    // Editor.assetdb.queryUrlByUuid( this.uuid, function ( err, url ) {
                    //     Editor.log( "info1", url );
                    // } );
                },
                _isUUID() {
                    let isUUID = Editor.Utils.UuidUtils.isUuid( this.uuid );
                    return isUUID;
                },

                _findInfo( type, uuidOrObj ) {
                    let self = this;
                    if ( type === "sprite-frame" ) {
                        Editor.log( "find sprite-frame" );
                        Editor.assetdb.queryAssets( "db://assets/resources/prefab/**/*", [ 'prefab', 'scene' ], function ( err, results ) {
                            Editor.log( "查找 prefab 文件数量：", results.length );
                            self._analyze( results, type, uuidOrObj || self.uuid );
                        } );
                    } else if ( type === "javascript" ) {
                        Editor.log( "find javascript" );
                        Editor.assetdb.queryAssets( "db://assets/resources/prefab/**/*", [ 'prefab', 'scene' ], function ( err, results ) {
                            Editor.log( "查找 prefab 文件数量：", results.length );
                            let uuid = uuidOrObj || Editor.Utils.UuidUtils.compressUuid( self.uuid );
                            self._analyze( results, type, uuid );
                        } );
                    }
                },

                _analyze( list, type, uuidOrObj ) {
                    let uuidObj = uuidOrObj;
                    if ( typeof uuidOrObj === "string" ) {
                        uuidObj = { [uuidOrObj]: { uuid: uuidOrObj } };
                    }
                    let len    = Array.isArray( list ) ? list.length : 0;
                    let result = "";
                    for ( let i = 0; i < len; i++ ) {
                        let template = Fs.readFileSync( list[i].path, 'utf-8' );
                        let json     = JSON.parse( template );
                        let num      = json.length;
                        Editor.log( "正在查找当前文件：", list[i].path );
                        for ( let j = 0; j < num; j++ ) {
                            let obj = json[j];
                            if ( !obj ) continue;
                            if ( type === "sprite-frame" ) {
                                if ( obj["__type__"] !== "cc.Sprite" ) continue;
                                if ( !obj["_spriteFrame"] ) continue;
                                let uObj = uuidObj[obj["_spriteFrame"]["__uuid__"]];
                                if ( !uObj ) continue;
                                uObj.isExist = true;
                                let url      = uObj.path ? "[" + uObj.path + "]" : "";
                                result       = result + url + list[i].path + "\n";
                            } else if ( type === "javascript" ) {
                                let uObj = uuidObj[obj["__type__"]];
                                let url  = "";
                                if ( uObj ) {
                                    url          = uObj.path ? "[" + uObj.path + "]" : "";
                                    result       = result + url + list[i].path + "\n";
                                    uObj.isExist = true;
                                    break;
                                }
                                let componentId = obj["_componentId"];
                                if ( !componentId ) continue;
                                uObj = uuidObj[componentId];
                                if ( !uObj ) continue;
                                uObj.isExist = true;
                                url          = uObj.path ? "[" + uObj.path + "]" : "";
                                result       = result + url + list[i].path + "\n";
                                break;
                            }
                        }
                    }
                    //查找玩家
                    Editor.log( "----------以下文件暂时没有找到使用---------------" );
                    let values = Object.values( uuidObj );
                    let count  = values.length;
                    let sum    = 0;
                    for ( let i = 0; i < count; i++ ) {
                        if ( values[i].isExist ) continue;
                        let path = values[i].path ? values[i].path : values[i].uuid;
                        Editor.log( path );
                        sum++;
                    }
                    Editor.log( "总计有", sum, "个类型", type, "文件未被引用" );
                    this.uuidObj = {};
                    this.isFind  = false;
                    Editor.log( "----------查找到以下文件以及在那个预制文件下使用---------------" );
                    Editor.log( result );
                    Editor.log( "----------complete---------------" );
                }
            }
        } );
    },

    // register your ipc messages here
    messages: {}
} );

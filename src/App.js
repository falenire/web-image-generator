import React, { Component } from 'react';
import uuidv4 from 'uuid/v4'
import './App.css';


const electron = window.require('electron')
const main = electron.remote.require('./main.js')
const fs = electron.remote.require('fs')
const gm = electron.remote.require('gm')//.subClass({imageMagick:true})
const isImage = electron.remote.require('is-image')
// const ipcRenderer = electron.ipcRenderer
const rootPath = electron.remote.require('electron-root-path').rootPath;
const packedPath = main.isPackaged ? '/Contents/Resources/app.asar.unpacked' : ''
const gpath = `${rootPath}${packedPath}/unpackedDir/graphicsmagick/1.3.31/bin/gm`
const colorProfilePath = `${rootPath}${packedPath}/unpackedDir/colorProfile/sRGB2014.icc`

console.log('isPacked:' ,main.isPackaged)

class BrandSizes {
  constructor(width, height, {top, right, bottom, left}, gravity, rotate) {
    this.width = width || 0;
    this.height = height || 0;
    this.gravity = gravity;
    this.rotate = rotate;
    this.paddingTop = top || 0;
    this.paddingRight = right || 0;
    this.paddingBottom = bottom || 0;
    this.paddingLeft = left || 0;
    return this;
  }
}

class App extends Component {
  constructor() {
    super();
    this.state={
      folders:null,
      progress:null,
      rotationAngle:0,
    }
    this.selectFolder = this.selectFolder.bind(this)
    this.updateRotationAngle = this.updateRotationAngle.bind(this)
    this.brands = React.createRef()
  }

  selectFolder(e) {
    console.log(e.target.files[0].path)
    const folders = {}
    folders[e.target.name]=e.target.files[0].path
    this.setState(prevState=>{
      return {folders: {...prevState.folders, ...folders}}
    })
  }

  updateRotationAngle(e) {
    console.log(this, e.target.value)
    this.setState({rotationAngle:e.target.value})
  }

  brandSpecs(brand) {
    let response = [];
    switch(brand) {
      case 'gelish':
        response.push(new BrandSizes (696,662,{top:27,bottom:250}))
        break;
      case 'gelish-swatch':
        response.push(new BrandSizes (192,192,{top:5,right:5,bottom:5,left:5}, 'center'))
        break;
      case 'rcm':
        response.push(new BrandSizes (500,500,{top:20,right:20,bottom:20,left:20}, 'center'))
        break;
      case 'entity':
        response.push(new BrandSizes (108,108,{top:3,right:3,bottom:3,left:3}, 'center'))
        response.push(new BrandSizes (554,554,{top:20,right:20,bottom:20,left:20}, 'center'))
        break;
      case 'entity-files':
        response.push(new BrandSizes (108,108,{},'center'))
        response.push(new BrandSizes (554,554,{}, 'center'))
        break;
      case 'entity-swatch':
        response.push(new BrandSizes (554,554,{top:20,right:20,bottom:20,left:20}, 'center'))
        response.push(new BrandSizes (160,160,{top:0,right:0,bottom:0,left:0}, 'center'))
        response.push(new BrandSizes (108,108,{top:3,right:3,bottom:3,left:3}, 'center'))
        break;
      case 'artistic':
        response.push(new BrandSizes (525,525,{top:40,right:40,bottom:40,left:40}, 'center'))
        response.push(new BrandSizes (259,259,{top:40,right:40,bottom:40,left:40}, 'center'))
        break;
    }
    console.log(response)
    return response;
  }

  processFiles = async () => {
    const brand = this.brands.current.value;
    console.log(this.brands, brand)
    const brandSpecs = this.brandSpecs(brand)
    this.setState({progress:1})
    new Promise((resolve, reject)=>{
      fs.readdir(this.state.folders.source, (err,items)=>{
        items = items.filter(file=>isImage(this.state.folders.source+'/'+file))
        console.log(items)
        let progressCount = 0;
        let totalCount = items.length * brandSpecs.length + items.length * 2;
        let tempFiles = [];
        items.map(async (file)=>{
          const tempFile = `/tmp/web-image-generator_${uuidv4()}`//'/tmp/'+uuidv4()
          const fileName = this.state.folders.source+'/'+file
          
          tempFiles.push(tempFile)
          
          console.log(fileName)
          // GET image size
          const fileSize = new Promise((resolve, reject)=>{
            gm(fileName, gpath)
              .trim()
              .profile(colorProfilePath)
              .write(tempFile, (err=>{
                if(err) throw new Error(err);
                progressCount++;
                console.log('progressCount write tmp: ', progressCount)
                if(!err) {
                  gm(tempFile, gpath)
                    .size((err,value)=>{
                      if(err) throw new Error(err); 
                      progressCount++;
                      console.log('progressCount size read: ', progressCount)
                      resolve(value)
                    })
                }
              }))
          }) 
          const sourceSize = await fileSize;
          console.log('Source Size: ',sourceSize)
              
          // Prep File
          
          brandSpecs.map(async imageSpecs=>{
            const response = await this.prepThumbnailFile(file, tempFile, imageSpecs, sourceSize)
            if(response===true) {
              progressCount++;
              console.log('progressCount write thumbnail: ', progressCount)
              console.log('done', progressCount, totalCount)
              if(progressCount >= totalCount) {
                this.setState({progress:null})
                resolve(tempFiles)
              } else {
                this.setState({progress:(progressCount/totalCount)*100})
              }
            }
          })        
        })
      })
    }).then(tempFiles=>{
      tempFiles.map(tempFile=>{
        fs.unlink(tempFile, error=>{
          if(error){throw new Error(error)}
          console.log(`${tempFile} was deleted.`)
        })
      })
    })
  }

  prepThumbnailFile(file, tempFile, imageSpecs, sourceSize) {
    return new Promise((resolve, reject)=>{
      // Start with Brand Specs
      let {width, height, gravity, paddingTop, paddingRight, paddingLeft, paddingBottom} = imageSpecs;
      const destFolder = `${this.state.folders.destination}/${width}`;
      const destName = destFolder+'/'+file

      // GET image orientation
      let resizeWidth = null;
      let resizeHeight = null;
      if(sourceSize.width > sourceSize.height) { 
        // Landscape
        resizeWidth = (width-paddingLeft-paddingRight)*2;
        resizeHeight = null
      } else { 
        // Portrait
        resizeHeight = (height-paddingTop-paddingBottom)*2;
        resizeWidth = null;
      }
      const gmTempFile = gm(tempFile, gpath);
      gmTempFile.resize(resizeWidth, resizeHeight);

      if(this.state.rotationAngle !== 0) {
        gmTempFile.rotate('rgba(255,255,255,0) ', (this.state.rotationAngle*-1))
      }
      
      if(gravity==='center') {
        gmTempFile.gravity('Center').extent(width*2,height*2);
      } else {
        if(!resizeWidth) {
          resizeWidth = (resizeHeight*(sourceSize.width))/(sourceSize.height)
        }
        if(!resizeHeight) {
          resizeHeight = (resizeWidth*(sourceSize.height))/(sourceSize.width)
        }
        // const xPos = width*2-(resizeWidth+(paddingRight*2));
        const xPos = 0;
        const yPos = height*2-(resizeHeight+(paddingBottom*2));
        gmTempFile.gravity('North').extent(width*2, height*2, `-${xPos}-${yPos}`);
      }

      console.log(imageSpecs)

      try {fs.mkdirSync(destFolder)} catch(err) {}
      gmTempFile.write(destName.replace('.jpg', '@2x.jpg').replace('.png', '@2x.png'), (err)=>{
        if(err) console.log(err)
        if(!err) console.log('done @2x: ', destName)
      })
      gmTempFile.resize(width, height);
      gmTempFile.write(destName, (err)=>{
        if(err) {
          reject(err)
          console.log(err);
        }
        if(!err) {
          console.log('done @1x: ', destName)
          resolve(true)
        }
      })

      // resolve(true);
    })
  }

  // generateThumbnailImages(file, gmObject, imageSpecs) {
    
  //   return new Promise((resolve, reject) => {
  //   })
  // }

  render() {
    console.log(this.state);
    return (
      <div className="App">
        <header className="App-header">
          <h1>Web Assets Gen</h1>
          <div className="form-wrapper">
            <label htmlFor="brands">Brand</label>
            <select id="brands" ref={this.brands}>
              <option value="gelish">Gelish</option>
              <option value="gelish-swatch">Gelish Swatches</option>
              <option value="artistic">Artistic</option>
              <option value="entity">Entity</option>
              <option value="rcm">RCM</option>
              <option value="entity-swatch">Entity Swatch</option>
              <option value="entity-files">Entity Files</option>
            </select>
            <label htmlFor="source-folder">Source Folder</label>
            <input type="file" name="source" id="source-folder" webkitdirectory="true" directory="true" onChange={this.selectFolder} />
            <label htmlFor="dest-folder">Destination Folder</label>
            <input type="file" name="destination" id="dest-folder" webkitdirectory="true" directory="true" onChange={this.selectFolder} />
            <label htmlFor="rotation-angle">Rotate</label>
            <div>
              <input type="text" name="rotation-angle" id="rotation-angle" value={this.state.rotationAngle} onChange={this.updateRotationAngle} /> Degrees
            </div>
            <div></div>
            <button onClick={this.processFiles} >Process</button>
          </div>
        </header>
        {this.state.progress && 
          loadingBar(this.state.progress)
        }
      </div>
    );
  }
}

const loadingBar = (percentage) => {
  return (
    <div className="loadingbar-wrapper">
      <div className="loadingbar" style={{width:percentage+'%'}}></div>
    </div>
  )
}

export default App;

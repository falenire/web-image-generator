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
  constructor(width, height, {top, right, bottom, left}, gravity, overflow) {
    this.width = width || 0;
    this.height = height || 0;
    this.gravity = gravity;
    this.overflow = overflow;
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
        response.push(new BrandSizes (696,662,{top:27,bottom:250}, 'North'))
        break;
      case 'gelish-swatch':
        response.push(new BrandSizes (192,192,{top:5,right:5,bottom:5,left:5}, 'Center'))
        break;
      case 'gelish-dip-collection-page':
        response.push(new BrandSizes (290,267,{top:30,right:20,bottom:15,left:20}, 'North'))
        break;
      case 'gelish-two-of-a-kind':
        response.push(new BrandSizes (317,492,{top:24,right:5,bottom:102,left:5}, 'North'))
        break;
      case 'getgelished':
        response.push(new BrandSizes (507,507,{top:5,right:5,bottom:5,left:5}, 'Center'))
        break;
      case 'gelish-dip-swatch':
        response.push(new BrandSizes (192,180,{top:17,right:17,bottom:5,left:17}, 'North'))
        break;
      case 'rcm':
        response.push(new BrandSizes (500,500,{top:20,right:20,bottom:20,left:20}, 'Center'))
        break;
      case 'rcm-swatch':
        response.push(new BrandSizes (300,300,{top:36,right:36,bottom:36,left:36}, 'Center'))
        break;
      case 'entity':
        response.push(new BrandSizes (108,108,{top:3,right:3,bottom:3,left:3}, 'Center'))
        response.push(new BrandSizes (554,554,{top:20,right:20,bottom:20,left:20}, 'Center'))
        break;
      case 'entity-files':
        response.push(new BrandSizes (108,108,{},'Center'))
        response.push(new BrandSizes (554,554,{}, 'Center'))
        break;
      case 'entity-swatch':
        response.push(new BrandSizes (554,554,{top:20,right:20,bottom:20,left:20}, 'Center'))
        response.push(new BrandSizes (160,160,{top:0,right:0,bottom:0,left:0}, 'Center'))
        response.push(new BrandSizes (108,108,{top:3,right:3,bottom:3,left:3}, 'Center'))
        break;
      case 'artistic':
        response.push(new BrandSizes (525,525,{top:40,right:40,bottom:40,left:40}, 'Center'))
        response.push(new BrandSizes (259,259,{top:40,right:40,bottom:40,left:40}, 'Center'))
        break;
      case 'artistic-swatches':
        response.push(new BrandSizes (1050,525,{}, 'Center', 'width'))
        response.push(new BrandSizes (126,126,{}, 'Center', 'width'))
        response.push(new BrandSizes (80,80,{}, 'Center', 'width'))
        break;
      case 'artistic-angels':
        response.push(new BrandSizes (400,400,{}, 'NorthWest'))
        response.push(new BrandSizes (250,250,{}, 'NorthWest'))
        break;
      case 'morgan-taylor':
        response.push(new BrandSizes (138,277,{top:12,right:16,bottom:8,left:16}, 'North'))
        break;
      case 'morgan-taylor-swatches':
        response.push(new BrandSizes (138,138,{}, 'Center'))
        break;
      case 'morgan-taylor-4-pack':
        response.push(new BrandSizes (227,207,{top:5,right:10,bottom:5,left:10}, 'Center'))
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
              //.noProfile()
              .profile(colorProfilePath)
              .colorspace('RGB')
              .shave(1, 1)
              .write(tempFile, err=>{
                if(err) throw new Error(err);
                gm(tempFile, gpath)
                .trim()
                .write(tempFile, err=>{
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
                })
              })
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
      let {width, height, gravity, paddingTop, paddingRight, paddingLeft, paddingBottom, overflow} = imageSpecs;
      const destFolder = `${this.state.folders.destination}/${width}`;
      const destName = destFolder+'/'+file
      
      const constrainHeight = (height-paddingTop-paddingBottom)*2;
      const constrainWidth = (width-paddingLeft-paddingRight)*2;
      
      // GET image orientation
      let resizeWidth = sourceSize.width;
      let resizeHeight = sourceSize.height;

      if(overflow !== 'width' && sourceSize.width > constrainWidth) {
        resizeWidth = constrainWidth
        resizeHeight = (resizeWidth*(sourceSize.height))/(sourceSize.width)
      }

      if(overflow !== 'height' && resizeHeight > constrainHeight) {
        resizeHeight = constrainHeight
        resizeWidth = (resizeHeight*(resizeWidth))/(resizeHeight)
      }

      const gmTempFile = gm(tempFile, gpath);
      gmTempFile.background('white')
      gmTempFile.resize(resizeWidth, resizeHeight);

      if(this.state.rotationAngle !== 0) {
        gmTempFile.rotate('rgba(255,255,255,0) ', (this.state.rotationAngle*-1))
      }
      
      switch(gravity) {
        case 'Center':
          gmTempFile.gravity('Center').extent(width*2,height*2);
          break;
        case 'North':
        case 'South':
          if(!resizeWidth) {
            resizeWidth = (resizeHeight*(sourceSize.width))/(sourceSize.height)
          }
          if(!resizeHeight) {
            resizeHeight = (resizeWidth*(sourceSize.height))/(sourceSize.width)
          }
          // const xPos = width*2-(resizeWidth+(paddingRight*2));
          const xPos = 0;
          const yPos = height*2-(resizeHeight+(paddingBottom*2));
          gmTempFile.gravity(gravity).extent(width*2, height*2, `-${xPos}-${yPos}`);
          break;
        default:
          gmTempFile.gravity(gravity).extent(width*2,height*2);
          break;
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
              <option value="gelish-dip-collection-page">Gelish Dip Jar In Collection Page</option>
              <option value="gelish-two-of-a-kind">Gelish Two of A Kind</option>
              <option value="gelish-dip-swatch">Gelish Dip Swatches</option>
              <option value="getgelished">Get Gelished</option>
              <option value="artistic">Artistic</option>
              <option value="artistic-angels">Artistic Angels</option>
              <option value="artistic-swatches">Artistic Swatches</option>
              <option value="morgan-taylor">MT Bottle</option>
              <option value="morgan-taylor-swatches">MT Swatch</option>
              <option value="morgan-taylor-4-pack">MT 4 Pack</option>
              <option value="rcm">RCM</option>
              <option value="rcm-swatch">RCM Swatches</option>
              <option value="entity">Entity</option>
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

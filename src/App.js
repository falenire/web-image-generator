import React, { Component } from 'react';
import './App.css';

const electron = window.require('electron')

const fs = electron.remote.require('fs')
const gm = electron.remote.require('gm')//.subClass({imageMagick:true})
const path = electron.remote.require('path')
const isImage = electron.remote.require('is-image')
const ipcRenderer = electron.ipcRenderer

// exec('convert '.$image.' -trim +repage '.$outputName);
// exec('convert '.$outputName.' -profile '.$colorSpace.' '.$outputName);


class App extends Component {
  constructor() {
    super();
    this.state={
      folders:null,
      progress:null,
    }
    this.selectFolder = this.selectFolder.bind(this)
  }

  selectFolder(e) {
    console.log(e.target.files[0].path)
    const folders = {}
    folders[e.target.name]=e.target.files[0].path
    this.setState(prevState=>{
      return {folders: {...folders, ...prevState.folders}}
    })
  }

  processFiles = async () => {
    const width = 525;
    const height = 525;
    const padding = 40;
    this.setState({progress:1})
    await fs.readdir(this.state.folders.source, (err,items)=>{
      console.log(items)
      items = items.filter(item=>isImage(item))
      let progressCount = 0;
      const destFolder = `${this.state.folders.destination}/${width}`;
      fs.mkdirSync(destFolder)
      items.map(async (file)=>{
        const fileName = this.state.folders.source+'/'+file
        const destName = destFolder+'/'+file

        // GET image size
        const fileSize = await gm(fileName).size((err,value)=>{
          console.log('err', err); console.log('value', value)
        })
        const {fileWidth, fileHeight} = {fileWidth:fileSize.data.size.width, fileHeight:fileSize.data.size.height}
        console.log(fileWidth, fileHeight)

        // GET image orientation

        let resizeWidth = null;
        let resizeHeight = null;

        if(fileWidth > fileHeight) { 
          // Landscape
          resizeWidth = (width-padding)*2;
          resizeHeight = null
        } else { 
          // Portrait
          resizeWidth = null;
          resizeHeight = (height-padding)*2;
        }

        const large = await gm(fileName)
          .trim()
          .profile(`colorProfile/sRGB2014.icc`)
          .resize(resizeWidth, resizeHeight)
          .gravity('Center')
          .extent(width*2, height*2);
        const small = large;
        large.write(destName.replace('.jpg', '@2x.jpg').replace('.png', '@2x.png'), (err)=>{
          if(err) console.log(err)
          if(!err) {
            console.log('done @2x')
          }
        })
        small.resize(width, height);
        small.write(destName, (err)=>{
          if(err) console.log(err)
          if(!err) {
            progressCount++;
            console.log('done', progressCount, items.length)
            if(progressCount >= items.length) {
              this.setState({progress:null})
            } else {
              this.setState({progress:(progressCount/items.length)*100})
            }
          }
        })
      })
    })
  }



  render() {
    console.log(this.state);
    return (
      <div className="App">
        <header className="App-header">
          <p>
            <input type="file" name="source" id="source-folder" webkitdirectory="true" directory="true" multiple="multiple" onChange={this.selectFolder} />
            <input type="file" name="destination" id="source-folder" webkitdirectory="true" directory="true" multiple="multiple" onChange={this.selectFolder} />
            <button onClick={this.processFiles} >Process</button>
          </p>
          <h1>Fabian es un duro</h1>
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

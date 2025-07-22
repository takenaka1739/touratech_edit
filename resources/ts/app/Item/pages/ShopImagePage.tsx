import { useState } from 'react';
//import Draggable from "react-draggable";
//import { Breadcrumbs } from '@/pages/';
//import AppLayout from '@/Layouts/AppLayout';
//import { usePage, router } from '@inertiajs/react';
//import ReactPlayer from 'react-player';
//import {useDropzone} from 'react-dropzone';
//import { DragEvent } from "react";
//import Image from "next/image";
//import { useCallback, useMemo } from 'react';
//import { useCallback} from 'react';
//import { useDropzone, FileWithPath } from 'react-dropzone';
//import { useDropzone } from 'react-dropzone';
import { useCallback, useRef } from 'react';
//import Image from './Image';
import { useMemo } from 'react';

export const ShopImagePage = () => {

  let variKind:{[key: string] : string[]} = 
  {"1":["1", "1"],
   "2":["2", "2"],
   "3":["3", "3"],
   "4":["4", "4"]};
  const [nameText, setNameText] = useState("商品名を入力して下さい");
  const [priceText, setpriceText] = useState("金額を入力して下さい");
  const [detailText, setDetailText] = useState("説明文を入力して下さい");
  const [variKindItem, setVariKind] = useState(variKind);
  const [dropErea, setDropErea] = useState("ここにファイルをドロップして下さい");
  const [selectImage, setselectImage] = useState("");

  const inputNameClick = () => {
    if(nameText == "商品名を入力して下さい"){
      setNameText("");
    }
  }
  const inputNameFocusOut = () => {
    if(nameText == ""){
      setNameText("商品名を入力して下さい");
    }
  }
  const inputPriceClick = () => {
    if(priceText == "金額を入力して下さい"){
      setpriceText("");
    }
  }
  const inputPriceFocusOut = () => {
    if(priceText == ""){
      setpriceText("金額を入力して下さい");
    }
  }
  const inputDetailClick = () => {
    if(detailText == "説明文を入力して下さい"){
      setDetailText("");
    }
  }
  const inputDetailFocusOut = () => {
    if(detailText == ""){
      setDetailText("説明文を入力して下さい");
    }
  }

  const addNewVari = (name:string) => {
    let variKind:{[key: string] : string[]} = {};

    // 連想配列の要素取り出し
    for (let key in variKindItem) {
      let arr:string[] = [];
      let strKey: string = `${key}`;
      // 連想配列内の配列要素の取り出し
      for (let i = 0; i < variKindItem[key].length; i++) {
        // 新しく定義した配列に既存のデータを保存
        arr.push(variKindItem[key][i]);
      }

      if(strKey === name){
        // 押されたボタンの配列に要素を一つ追加
        arr.push("");
      }

      variKind[strKey] = arr;
    }
    setVariKind(variKind);
  }

  const deleVari = (name:string, index:number) => {
    let variKind:{[key: string] : string[]} = {};

    // 連想配列の要素取り出し
    for (let key in variKindItem) {
      let arr:string[] = [];
      let strKey: string = `${key}`;
      // 連想配列内の配列要素の取り出し
      for (let i = 0; i < variKindItem[key].length; i++) {
        if((strKey === name && i != index) || (strKey != name)){
        // 新しく定義した配列に既存のデータを保存
          arr.push(variKindItem[key][i]);
        }
      }
      variKind[strKey] = arr;
    }
    setVariKind(variKind);
  }

  type Props = {
    file: File;
  };

  // 画像ドロップの処理
 const [files, setFiles] = useState<File[]>([]);
  const attachRef = useRef<HTMLInputElement>(null);
  //const [dragging, setDragging] = useState<number>(0);

  const handleInpuFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files == null) return;
    const files = Array.from(e.target.files);
    setFiles((current) => current.concat(files));
    if (attachRef.current) attachRef.current.value = '';
  }, []);

  const onDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    //setDragging((current) => current + 1);
    setDropErea("");
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDropErea("");
    //setDragging((current) => current - 1);
  }, []);

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    setDropErea("");
  }, []);

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer.items)
      .map((item) => item.getAsFile())
      .filter((file): file is File => file !== null);
    setFiles((current) => current.concat(files));
    setDropErea("");
  }, []);

  const onPaste = useCallback(
    (e: React.ClipboardEvent<HTMLDivElement>) => {
      const file = e.clipboardData.items[0].getAsFile() ?? undefined;
      if (file === undefined) return; // ファイルでない場合は処理終了
      setFiles((current) => current.concat(file));
      setDropErea("");
    },
    []
  );

  const handleClick = (src:string) => {
    setselectImage(src);
  };

  const Image = ({ file }: Props) => {
    const src = useMemo(() => URL.createObjectURL(file), [file]);
    return<img src={src} onClick={() => handleClick(src)} alt={file.name} style={{height: '80px', width: '80px'}}></img>;
  };


  return (
    <div id="shop-image">
      <div id="button-area">
        <a id="back-button">← 受注管理システム</a>
        <a id="ref-button">他商品情報参照</a>
      </div>
      <div id="input-area">
        <div id="image-area">
          <img src={selectImage}></img>
            <div className="image-input-erea">
              <input type="file" style={{ display: 'none' }} ref={attachRef} multiple onChange={handleInpuFileChange}></input>
              <div
                //style={{ border: 'dashed 1px #000', padding: 20, backgroundColor: dragging > 0 ? '#ccc' : undefined }}
                style={{ height: '100px', width: '450px' }}
                tabIndex={0}
                onDragEnter={onDragEnter}
                onDragLeave={onDragLeave}
                onDragOver={onDragOver}
                onDrop={onDrop}
                onPaste={onPaste}
              >
                <p style={{fontSize: '20px', color: '#c9d7e8f8', textAlign: 'center'}}>{dropErea}</p>
                <div style={{display: 'flex'}}>
                  {files.map((f) => (
                    <div key={f.name} style={{padding:'10px'}}>
                      {/*{f.name}*/}
                      <Image file={f}></Image>
                      {/*{setDropErea("")}*/}
                    </div>
                  ))}
                </div>
              </div>
              {/*<p>{imageItem}</p>
              <input className="a" onDrop={() => onDrop}/>*/}
              {/*<div>
                <div {...getRootProps()}>
                  <input type="file" onDrop={() => onDrop} className="b"/>
                  {imageItems.map((imageItem) => {
                    return (
                    <img src={imageItem} className="img"></img>
                    )})}
                </div>
              </div>*/}
            </div>
          </div>
          <img src="/defbe5d2e16490334ffd8c22f1469ce6_t.jpg"/>
        <div id="item-info">
          <input id="item-name" value={nameText}
                 onClick={() => inputNameClick()}
                 onBlur={() => inputNameFocusOut()}
                 onChange={(event) => setNameText(event.target.value)}/>
          <hr/>
          <div id="price-col">
            <label className="label-basic">￥</label>
            <input id="input-price" value={priceText}
                   onClick={() => inputPriceClick()}
                   onBlur={() => inputPriceFocusOut()}
                   onChange={(event) => setpriceText(event.target.value)}/>
            <label className="label-basic">（税込み）</label>
          </div>
          <label className="point-label">ポイント：〇〇pt</label>
          <hr/>
          <div id="item-detail-erea">
            <label className="label-basic">この商品について</label>
            <input id="item-detail" value={detailText}
                   onClick={() => inputDetailClick()}
                   onBlur={() => inputDetailFocusOut()}
                   onChange={(event) => setDetailText(event.target.value)}/>
          </div>
        </div>
        <div id="vari-info">{ 
          Object.keys(variKindItem).map((name, index) => {
            return (
              <div className="vari-item">
                <div className="vari-name-row">
                  <label>{index + 1}</label>
                  <input className="input-text" value={name}/>
                  <button className="plus-button" onClick={() => addNewVari(name)}>＋</button>
                </div>
                <div className="vari-kind-list"> {
                  variKindItem[name].map((value, index) => {
                    return (
                      <div className="vari-kind">
                        <input className="vari-row-input"
                          type="text"
                          value={value}
                        />
                        <button className="dele-button" onClick={() => deleVari(name, index)}>✕</button>
                      </div>
                    )}
                  )}
                </div>
              </div>
            );
          })
        }</div>
      </div>
    </div>
  );
};
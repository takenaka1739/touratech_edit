//import { useState } from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { useCallback, useRef, useMemo, useState } from 'react';
//import { useMemo } from 'react';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
//import { useCommonDetailPage } from '@/app/App/uses/useCommonDetailPage';
//import { Item } from '@/types';
//import SimpleBar from 'simplebar';
import { ItemDetailPage } from './ItemDetailPage';

export type ItemDetailPageProps = {} & RouteComponentProps<{ id: string }>;

export const ShopImagePage: React.VFC<ItemDetailPageProps> = () => {

  console.log(`ItemDetailPage:${ItemDetailPage}`);

  let variKind:{[key: string] : string[]} = 
  {"1":["1", "1"],
   "2":["2", "2"],
   "3":["3", "3"],
   "4":["4", "4"]};
  const [nameText, setNameText] = useState("商品名を入力して下さい");
  const [priceText, setpriceText] = useState("金額を入力して下さい");
  const [detailText, setDetailText] = useState("説明文を入力して下さい");
  const [variKindItem, setVariKind] = useState(variKind);
  const [pointText, setpoint] = useState("  ");
  const [dropErea, setDropErea] = useState("ここにファイルをドロップして下さい");
  //const [selectImage, setselectImage] = useState({src:'', type:-1, pTag:'visible', imgvisible:'hidden', vdovisible:'hidden'});
  //const [selectImage, setselectImage] = useState({pTag:'visible', imgvisible:'hidden', vdovisible:'hidden'});
  const [selectImageSrc, setImageSrc] = useState('');
  const [selectImageType, setImageType] = useState(-1);
  //const [visible, setVisibility] = useState(false);
  //const [opacity, setOpacity] = useState(0);
  //const [backgroundColor, setBackgroundColor] = useState('transparent');


  // 各入力欄の値設定
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
    }else{
      Number(priceText) > 100 ? setpoint(String(Number(priceText) / 100)) : setpoint("  ");
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
    setDropErea("");
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDropErea("");
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
    },[]
  );

  const handleClick = (src:string, type:number) => {
    setImageSrc(src);
    setImageType(type);
    //setselectImage({pTag:'hidden', imgvisible:imgvisible, vdovisible:vdovisible});
  };

  const Image = ({ file }: Props) => {
    console.log(`file${file}`);
    const src = useMemo(() => URL.createObjectURL(file), [file]);
    let type = file.type.indexOf('video');
    if(type == -1){
      return (
        <div>
          <img key={src} src={src} onClick={() => handleClick(src, type)} alt={file.name} style={{height: '80px', width: '80px', margin: '10px'}} ></img>
        </div>
      );
    }else{
      return (
        <div>
          <video onClick={() => handleClick(src, type)} style={{height: '80px', width: '80px', margin: '10px'}}>
            <source src={src} type="video/mp4"/>
          </video>
        </div>
      );
    }
  };

  const onDragEnd = (result: any) => {
     //console.log('発火');
    // drag時のindexの値
     //console.log(result.source.index);
    // drag終了後のindexの値
     //console.log(result.destination.index);
    const remove = files.splice(result.source.index, 1);
    files.splice(result.destination.index, 0, remove[0]);
  };

  return (
    <div id="shop-image">
      <div id="button-area">
        <a id="back-button">← 受注管理システム</a>
        <a id="ref-button">他商品情報参照</a>
      </div>
      <div id="input-area">
        <div id="image-area">
          {console.log(`selectImageSrc：${selectImageSrc}`)}
          <div>{ selectImageType === -1 ? 
              (<img key={selectImageType} className="image-size" src={selectImageSrc}/>) : 
              (<video className="image-size" controls>
                <source src={selectImageSrc} type="video/mp4"/>
              </video>)
          }</div>
          <div className="image-input-erea">
            <input type="file" style={{ display: 'none'}} ref={attachRef} multiple onChange={handleInpuFileChange}/>
            <div
              style={{ height: '100px', width: '450px' }}
              tabIndex={0}
              onDragEnter={onDragEnter}
              onDragLeave={onDragLeave}
              onDragOver={onDragOver}
              onDrop={onDrop}
              onPaste={onPaste}
            >
              <p style={{height: '30px', fontSize: '20px', color: '#c9d7e8f8', textAlign: 'center', position: 'absolute'}}>{dropErea}</p>
              <DragDropContext onDragEnd={onDragEnd}> 
                <Droppable droppableId="droppable" direction="horizontal">
                  {(provided) => (
                    <div style={{display: 'flex', position: 'absolute'}} {...provided.droppableProps} ref={provided.innerRef}>
                      {files.map((f, index) => (
                        <Draggable draggableId={String(index)} index={index} key={String(f)}>
                          {/* Droppableで指定した引数をそのまま指定する */}
                          {(provided) => (
                            // この中で静的なdivタグなどを指定できる
                            //  <div {...provided.draggableProps} ref={provided.innerRef}>もお作法
                            // 実際に掴んで移動させるpropsに{...provided.dragHandleProps}をつける
                            <div style={{display: 'flex'}} {...provided.draggableProps} ref={provided.innerRef}>
                              <div key={f.name} {...provided.dragHandleProps}>
                                  <Image file={f}/>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
              {/*<input className="a" style={{visibility: visible ? "visible" : "hidden", opacity: opacity, backgroundColor: backgroundColor}} onClick={() => addUrl()}/>*/}
              <div className="a" style={{display: 'flex', padding: '0px'}}>
                <input style={{width: '370px', backgroundColor: 'transparent'}}/>
                <button style={{width: '80px'}} onClick={() => Image}>追加</button>
              </div>
              {/*</button>*/}
            </div>
          </div>
        </div>
        <img src={"./c111583894027.jpg"} style={{width: '80px', height: '90px', marginTop: '551px'}}/>
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
          <label className="point-label">ポイント：{pointText}pt</label>
          <hr/>
          <div id="item-detail-erea">
            <label className="label-basic">この商品について</label>
            <input id="item-detail" value={""}
                   onClick={() => inputDetailClick()}
                   onBlur={() => inputDetailFocusOut()}
                   onChange={(event) => setDetailText(event.target.value)}/>
          </div>
        </div>
        <div key={"variation"} id="vari-info">{ 
          Object.keys(variKindItem).map((name, index) => {
            return (
              <div key={name+index+"vari-item"} className="vari-item">
                <div key={name+index+"vari-name-row"} className="vari-name-row">
                  <label>{index + 1}</label>
                  <input className="input-text" value={name}/>
                  <button key={index} className="plus-button" onClick={() => addNewVari(name)}>＋</button>
                </div>
                <div key={index+index+"vari-kind-list"} className="vari-kind-list"> {
                  variKindItem[name].map((value, index) => {
                    return (
                      <div key={value+index+"vari-kind"} className="vari-kind">
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
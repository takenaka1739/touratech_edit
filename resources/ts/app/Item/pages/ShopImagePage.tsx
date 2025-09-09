//import { useState } from 'react';
//import { RouteComponentProps } from 'react-router-dom';
//import { forEach } from 'lodash';
import { useCallback, useRef, useMemo, useState } from 'react';
//import { useMemo } from 'react';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
//import { useCommonDetailPage } from '@/app/App/uses/useCommonDetailPage';
//import { Item } from '@/types';
//import SimpleBar from 'simplebar-react';
import { useLocation } from 'react-router-dom';
//import { TableScrollbar } from 'react-table-scrollbar';
//import { ScrollView} from 'react-native';

export type ItemDetailPageProps = {};

export const ShopImagePage: React.VFC<ItemDetailPageProps> = () => {

  type Props = {
    file: File;
  };

  const location = useLocation<any>();
  const attachRef = useRef<HTMLInputElement>(null);

  const [nameText, setNameText] = useState(location.state.itemName ?? "商品名を入力して下さい");
  const [priceText, setpriceText] = useState(location.state.salesPriceItem ?? "金額を入力して下さい");
  const [detailText, setDetailText] = useState(location.state.exDetail ?? "説明文を入力して下さい");
  const [movieUrl, setMovieUrl] = useState('');
  const variKindItem = location.state.variItems;
  const [pointText, setpoint] = useState("  ");
  const [dropErea, setDropErea] = useState("ファイルドロップまたはURLを入力して下さい");
  const [selectImageSrc, setImageSrc] = useState('');
  const [selectImageType, setImageType] = useState(-1);
  const [files, setFiles] = useState<any[]>(location.state.imageItems[0]);
  //const [selectVari, setSelectVari] = useState(0);

  console.log(`typeof：${typeof files}`);


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

  // 画像ドロップの処理
  const handleInpuFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files == null) return;
    const files = Array.from(e.target.files);
    console.log(`files：${files}`);
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

  const addMovie = () => {
    console.log('url追加');
    setFiles((current) => current.concat(movieUrl));
    setMovieUrl('');
  }

  const Image = ({ file }: Props) => {
    let fileType = typeof file; // { id: number; name: string; }
    console.log(`fileType：${fileType}`);

    if(fileType == 'object'){
      let type = file.type.indexOf('video');
      const src = useMemo(() => URL.createObjectURL(file), [file]);
      if(type == -1){
        console.log(`img：${type}`);
        return (
          <div style={{height: '80px', width: '80px', margin: '10px'}}>
            <img key={src} src={src} onClick={() => handleClick(src, type)} alt={file.name}></img>
          </div>
        );
      }else{
        const src = useMemo(() => URL.createObjectURL(file), [file]);
        return (
          <div style={{height: '80px', width: '80px', margin: '10px'}}>
            <video onClick={() => handleClick(src, type)}>
              <source src={src} type="video/mp4"/>
            </video>
          </div>
        );
      }
    }else{
      const src = String(file);
      if(((src.indexOf('jpg')) || (src.indexOf('gif')) || (src.indexOf('png'))) != -1 ){
        return (
          <div style={{height: '80px', width: '80px', margin: '10px'}}>
            <img key={src} src={src} onClick={() => handleClick(src, -1)}/>
          </div>
        );
      }else if(((src.indexOf('mp4')) || (src.indexOf('mov'))) != -1){
        return (
          <div style={{height: '80px', width: '80px', margin: '10px'}}>
            <video onClick={() => handleClick(src, 3)}>
              <source src={src} type="video/mp4"/>
            </video>
          </div>
        );
      }else{
        return (
          <div style={{margin: "10px"}} onClick={() => handleClick(src, 2)}>
            <iframe
              width="80px"
              height="80px"
              src={src}
              title="YouTube video player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
        )
      }
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

  const clickVariItem = (index:number) => {
    setpriceText(variKindItem[index][5]);
    setFiles(location.state.imageItems[index]);
    if(Number(variKindItem[index][5]) >= 100) setpoint(String(Number(variKindItem[index][5]) / 100))
    else setpoint('0');
  }

  location.state.imageItems.forEach((value:string) => {
    console.log(value);
  });

  console.log(`files：${files}`);

  return (
    <div id="shop-image">
      <div id="button-area">
        <a id="back-button">← 受注管理システム</a>
      </div>
      <div id="input-area">
        <div id="image-area">
          {console.log(`selectImageSrc：${selectImageSrc}`)}
          <div>{ selectImageType === -1 ? (<img key={selectImageType} className="image-size" src={selectImageSrc}/>) : 
                 selectImageType === 2 ? (<iframe key={selectImageType} className="image-size" src={selectImageSrc}
                                                  style={{width: '100px', height: '100px'}}
                                                  title="YouTube video player"
                                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture;
                                                         web-share"
                                                  referrerPolicy="strict-origin-when-cross-origin"
                                                  allowFullScreen/>) : 
                                         (<video className="image-size" controls>
                                           <source src={selectImageSrc} type="video/mp4"/>
                                         </video>)
          }</div>
          <div className="image-input-erea">
            <input type="file" style={{ display: 'none' }} ref={attachRef} multiple onChange={handleInpuFileChange}/>
            <div 
              style={{ height: '115px', width: '450px'}}
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
                    <div className="scllowDiv" {...provided.droppableProps} ref={provided.innerRef}>
                      {files.map((f, index) => (
                        <Draggable draggableId={String(index)} index={index} key={String(f)}>
                          {/* Droppableで指定した引数をそのまま指定する */}
                          {(provided) => (
                            // この中で静的なdivタグなどを指定できる
                            //  <div {...provided.draggableProps} ref={provided.innerRef}>もお作法
                            // 実際に掴んで移動させるpropsに{...provided.dragHandleProps}をつける
                            //<SimpleBar style={{ width: 500, height: 300 }}>
                                                    //<section style={{overflowX: 'scroll'}}>
                              <div key={index} style={{display: 'flex'}} {...provided.draggableProps} ref={provided.innerRef}>
                                <div key={f.name} {...provided.dragHandleProps}>
                                  {/*<section style={{overflowX: 'scroll'}}>*/}
                                    <Image file={f}/>
                                  {/*</section>*/}
                                </div>
                              </div>
                                              //</section>
                          )}
                        </Draggable>
                      ))}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
              {/*<input className="a" style={{visibility: visible ? "visible" : "hidden", opacity: opacity, backgroundColor: backgroundColor}} onClick={() => addUrl()}/>*/}
              <div className="a" style={{display: 'flex', padding: '0px'}}>
                <input value={movieUrl} onChange={(event) => setMovieUrl(event.target.value)} style={{width: '370px', backgroundColor: 'transparent'}}/>
                <button style={{width: '80px'}} onClick={() => addMovie()}>追加</button>
              </div>
              {/*</button>*/}
            </div>
          </div>
        </div>
        {/*<img src={"c111583894027.jpg"} style={{width: '80px', height: '90px', marginTop: '551px'}}/>*/}
        <div id="dust-box-icon">
          <img src={"/images/defbe5d2e16490334ffd8c22f1469ce6_t.jpg"}/>
        </div>
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
            <textarea id="item-detail" value={detailText}
                   onClick={() => inputDetailClick()}
                   onBlur={() => inputDetailFocusOut()}
                   onChange={(event) => setDetailText(event.target.value)}/>
          </div>
        </div>
        <div style={{marginLeft: '60px', marginTop: '10px'}}>{variKindItem.map((item:any, index:number) => {
                console.log(`item.map：${item}}`);
                return (
                  <div key={'vari-erea-key'}>
                    <button id="vari-erea" onClick={() => clickVariItem(index)}>
                      {item[0] + '/' + item[1] + '/' + item[2] + '/' + item[3]}
                    </button>
                  </div> 
                )
              })}</div> 
      </div>
    </div>
  );
};
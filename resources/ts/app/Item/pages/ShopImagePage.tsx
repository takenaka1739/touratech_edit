
import { useCallback, useRef, useMemo, useState, useEffect } from 'react';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import { useLocation, useHistory } from 'react-router-dom';

export type ItemDetailPageProps = {};

export const ShopImagePage: React.VFC<ItemDetailPageProps> = () => {
  type Props = {
    file: File;
  };

  const location = useLocation<any>();
  const attachRef = useRef<HTMLInputElement>(null);

  //const [nameText, setNameText] = useState(location.state.itemName ?? "商品名を入力して下さい");
  const [nameText, setNameText] = useState(location.state.items.name ?? "商品名を入力して下さい");
  const [priceText, setpriceText] = useState(location.state.items.sales_price ?? "金額を入力して下さい");
  const [detailText, setDetailText] = useState(location.state.exDetail ?? "説明文を入力して下さい");
  const [movieUrl, setMovieUrl] = useState('');
  //const variKindItem = location.state.variItems;
  const [variKindItem, setVariKindItem] = useState(location.state.variItems);
  const [variChangeItem, setVariChangeItem] = useState(location.state.variChangeItem);
  const [pointText, setpoint] = useState("  ");
  const [dropErea, setDropErea] = useState("");
  const [selectImageSrc, setImageSrc] = useState('');
  const [selectImageType, setImageType] = useState(-1);
  const [files, setFiles] = useState<any[]>(Array.isArray(location.state?.imageItems) ? location.state.imageItems[0] : ['']);
  const [clicked, setClicked] = useState(false);
  const [SelectImage, setSelectImage] = useState('');

const [selectId, setSelectId] = useState(
  Array.isArray(location.state?.imageItems) && location.state.imageItems.length > 0
    ? location.state.imageItems[0][0]
    : null
);

console.dir('files');
console.dir(files);

const [selectIndex, setSelectIndex] = useState(0);

const variItems = Array.isArray(location.state?.variItems)
  ? location.state.variItems
  : [];

const imageItems = Array.isArray(location.state?.imageItems)
  ? location.state.imageItems
  : [];

const initialMatrix = variItems.map((variItem:any) => {
  let imageRow:any = [[]];
  const hasSameValue = imageItems.some((arr:any) => arr[0] === variItem[0]);
  if(hasSameValue){
    const matchedItems = imageItems.filter((row:any) => row[0] === variItem[0]);
    imageRow = [...matchedItems[0]];
  }else{
    const item = [variItem[0], ''];
    imageRow = [...item];
  }
  return Array.isArray(imageRow) ? imageRow : [''];
});

const [edtImageItems, setEdtImageItems] = useState<any[][]>(initialMatrix);

useEffect(() => {
  if(!Array.isArray(location.state?.imageItems)){
    if (((Array.isArray(location.state?.variItems)) && (location.state?.variItems.length > 0))) {
      const initial = location.state.variItems.map((value: any) => [value[0], ''])
      setEdtImageItems(initial);
      setSelectId(initial[0][0]);
    }
  }
}, [])

  const [delimageItem, setDelImageItem] = useState<string[][]>([]);
  const history = useHistory();

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
    const updatedItems = variKindItem.map((row:any) => {
      if (row[0] === selectId) {
        const newRow = [...row]; // 元の配列をコピーして破壊的変更を避ける
        newRow[6] = priceText;    // 5番目の要素（index 4）を書き換え
        return newRow;
      }
      return row;
    });
    setVariKindItem(updatedItems);

    const updateChangeItems = (() => {
      const exists = variChangeItem.some((row:any) => row[0] === selectId);
      location.state.preVariItem.find((row: any) => row[0] === selectId)[6] = priceText;

      if (exists) {
        // 該当行がある場合：更新
        return variChangeItem.map((row:any) => {
          if (row[0] === selectId) {
            const newRow = [...row];
            newRow[6] = priceText;
            return newRow;
          }
          return row;
        });
      } else {
        // 該当行がない場合：variKindItem から探して追加
        const matched = variKindItem.find((row:any) => row[0] === selectId);
        if (matched) {
          const newRow = [...matched];
          newRow[6] = priceText; // 価格情報を追加
          return [...variChangeItem, newRow];
        } else {
          // 該当なしの場合はそのまま返す（または何もしない）
          return variChangeItem;
        }
      }
    })();
    setVariChangeItem(updateChangeItems);


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
    const newFiles = Array.from(e.target.files);
    setFiles((current) => current.concat(newFiles));
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

    const addFiles = Array.from(e.dataTransfer.items)
      .map((item) => item.getAsFile())
      .filter((file): file is File => file !== null);
      setFiles((current) => Array.isArray(current) ? current.concat(addFiles) : [...addFiles]);

    if (Array.isArray(edtImageItems)) {
      const item = edtImageItems[selectIndex];

      if (item[0] === selectId) {
        const updatedMatrix = edtImageItems.filter((_, idx) => idx !== selectIndex);
        const a = edtImageItems[selectIndex].concat(addFiles);
      
        if (selectIndex === 0) {
          const withoutFirst = edtImageItems.slice(1);
          const addItem = [a, ...withoutFirst];
          setEdtImageItems(addItem);
        } else {
          const addItem = [...updatedMatrix.slice(0, selectIndex), a, ...updatedMatrix.slice(selectIndex)];
          setEdtImageItems(addItem);
        }
      
        //break; // ← ここでループを抜ける
      } else {
        const a = [selectId, ...addFiles];  
        const withoutFirst = edtImageItems.filter((_, i) => i !== selectIndex);
        const addItem = [...withoutFirst.slice(0, selectIndex), a, ...withoutFirst.slice(selectIndex)];
        setEdtImageItems(addItem);
      }
    }else{
      //const a = edtImageItems[index].concat(addFiles);
      //const addItem = [...updatedMatrix.slice(0, index), a, ...updatedMatrix.slice(index)];
      //setEdtImageItems(addFiles);
    }

    setDropErea("");
  }, [edtImageItems, selectId]);

  const onPaste = useCallback(
    (e: React.ClipboardEvent<HTMLDivElement>) => {
      const file = e.clipboardData.items[0].getAsFile() ?? undefined;
      if (file === undefined) return; // ファイルでない場合は処理終了
      setFiles((current) => current.concat(file));
      setDropErea("");
    },[]
  );

  const onDragEnd = (result: any) => {
    // drag時のindexの値
    // drag終了後のindexの値
    const remove = files.splice(result.source.index, 1);
    files.splice(result.destination.index, 0, remove[0]);
  };

  const handleClick = (src:string, type:number, fileName:string) => {
    if(type !== 2){
      if (src.includes("blob:")) {
        setSelectImage(fileName);
      }
    }

    setImageSrc(src);
    setImageType(type);
    setClicked(true);
  };

  const addMovie = () => {
    if (movieUrl.trim() === '') return;
    setFiles((current) => current.concat(movieUrl));
    setMovieUrl('');

    if (Array.isArray(edtImageItems)) {
      const index = edtImageItems.findIndex((item: any) => item[0] === selectId);
      if (index !== -1) {
        const originalItem = edtImageItems[index];
        const updatedItem = [originalItem[0], ...originalItem.slice(1), movieUrl];
        const updatedMatrix = edtImageItems.map((item: any, idx: number) =>
          idx === index ? updatedItem : item
        );
        setEdtImageItems(updatedMatrix);
      } else {
        const newItem = [selectId, movieUrl];
        setEdtImageItems([...edtImageItems, newItem]);
      }
    } else {
      const newItem = [selectId, movieUrl];
      setEdtImageItems([newItem]);
    }
  }

  const removeFileByName = (targetName: string) => {
    edtImageItems.map((item:any, index:number) => {
      let fileItem: string[] = [];
      if(item[0] === files[0]){
        let delFile = [];
        // 該当ファイルの削除処理
        if(targetName.includes("blob:")){
          delFile = edtImageItems[index].filter((file:File) => file.name !== SelectImage);
        }else{
          delFile = edtImageItems[index].filter((file:string) => file !== targetName);
        }
        // 編集行の削除
        const updatedMatrix = edtImageItems.filter((_:any, idx:number) => idx !== index);
        // 編集行の再追加
        const addItem = [...updatedMatrix.slice(0, index), delFile, ...updatedMatrix.slice(index)];
        //fileItem.push(item[0], targetName.replace("public/images/", ""));
        fileItem.push(item[0], targetName.replace("/images/", ""));
        //const addFileItem = [...delimageItem, fileItem];
        // 更新
        setEdtImageItems(addItem); // 内部データの配列更新
        setFiles(delFile); // ユーザーに表示される部分の配列更新
        //setDelImageItem(addFileItem);
        setDelImageItem(prev => [...prev, fileItem]);

        setImageSrc('');
      }
    });
  };

  const clickVariItem = (index:number) => {
    setSelectIndex(index);
    setpriceText(variKindItem[index][6]);
    setSelectId(variKindItem[index][0]);
    if(Array.isArray(edtImageItems[index])){
      setFiles(edtImageItems[index]);
    }else{
      setFiles([]);
    }

    if(Number(variKindItem[index][6]) >= 100) setpoint(String(Number(variKindItem[index][6]) / 100))
    else setpoint('0');
  }

  const handleBack = () => {
    const url = location.state.item_id !== undefined ? `/item/detail/${location.state.item_id}` : `/item/detail`;
    history.push({ pathname: url,
                      state: {itemName: nameText,
                              preVariItem:location.state.preVariItem,
                              preState: location.state.items,
                              exDetail: detailText === '説明文を入力して下さい' ? '' : detailText,
                              preImageItem: location.state.imageItems,
                              imageItem: edtImageItems,
                              delimageItem: delimageItem,
                              variItems: variKindItem,
                              variChangeItem: variChangeItem,
                              backVariItems: location.state.backVariItems,
                              categoryChangeFlag: location.state.categoryChangeFlag,
                              supplierChangeFlag: location.state.supplierChangeFlag
                      }}); // 1つ前の履歴に戻る
    //history.goBack(); // 1つ前の履歴に戻る
  };

  const Image = ({ file }: Props) => {
    const fileType = typeof file;
    // File/Blob 判定
    const isBlobLike = file instanceof Blob;
    if (fileType === 'object' && isBlobLike && typeof file !== 'string') {
      const isVideo = typeof file.type === 'string' && file.type.indexOf('video') !== -1;
      const src = useMemo(() => URL.createObjectURL(file), [file]);
    
      if (!isVideo) {
        return (
          <div style={{ height: '80px', width: '80px', margin: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <img key={src} src={src} onClick={() => handleClick(src, -1, file.name)} alt={file.name} />
          </div>
        );
      } else {
        return (
          <div style={{ height: '80px', width: '80px', margin: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
            <video onClick={() => handleClick(src, 3, file.name)} muted>
              <source src={src} type="video/mp4" />
            </video>
          </div>
        );
      }
    } else {
      const src = String(file);
      const isImage = ['jpg', 'gif', 'png'].some(ext => src.includes(ext));
      const isVideo = ['mp4', 'mov'].some(ext => src.includes(ext));
      if(src !== ''){
        if (isImage) {
          return (
            <div style={{ height: '80px', width: '80px', margin: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <img key={src} src={src} onClick={() => handleClick(src, -1, '')} />
            </div>
          );
        } else if (isVideo) {
          return (
            <div style={{ height: '80px', width: '80px', margin: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <video style={{marginTop: '10px'}} onClick={() => handleClick(src, 3, '')}>
                <source src={src} type="video/mp4" />
              </video>
            </div>
          );
        } else {
          return (
            <div style={{ margin: '10px', position: 'relative' }}> {/*onClick={() => handleClick(src, 2)}*/}
              <iframe
                width="80px"
                height="80px"
                src={src}
                style={{ pointerEvents: 'none' }}
                title="YouTube video player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
              {/* クリック検知用オーバーレイ */}
              {(
                <div
                  //onClick={() => youtubeClick(src, 2)}
                  onClick={() => handleClick(src, 2, '')}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    cursor: 'pointer',
                    zIndex: 10,
                  }}
                />
              )}
            </div>
          );
        }
      }
    }
    return null;
  };
  
  return (
    <div id="shop-image">
      <div id="button-area">
        <button id="back-button" onClick={() => handleBack()}>← 受注管理システム</button>
      </div>
      <div id="input-area">
        <div id="image-area">
          <button className="btn-delete"
                  style={{ marginLeft:'495px', marginBottom:'5px', height: '26px', paddingTop: '0px', paddingBottom: '0px', whiteSpace: "nowrap"}}
                  onClick={() => removeFileByName(selectImageSrc)}>
            削除
          </button>
          <div>
            {selectImageType === -1 ? (
              <img
                key={selectImageType}
                className="image-size"
                src={selectImageSrc}
              />
            ) : selectImageType === 2 && clicked ? (
              <iframe
                key={selectImageType}
                className="image-size"
                src={selectImageSrc}
                title="YouTube video player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            ) : selectImageSrc ? (
              <video className="image-size" controls muted>
                <source src={selectImageSrc} type="video/mp4" />
              </video>
            ) : (
              <img className="image-size"/>
            )}
          </div>

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
                <Droppable key={'droppable'} droppableId="droppable" direction="horizontal">
                  {(provided) => (
                    <div key={'scllowDiv'} className="scllowDiv" {...provided.droppableProps} ref={provided.innerRef}>
                      {files.map((f, index) => {
                        if (index > 0) {
                          return (
                            <Draggable key={String(index)} draggableId={String(index)} index={index}>
                              {/* Droppableで指定した引数をそのまま指定する */}
                              {(provided) => (
                                // この中で静的なdivタグなどを指定できる
                                //  <div {...provided.draggableProps} ref={provided.innerRef}>もお作法
                                // 実際に掴んで移動させるpropsに{...provided.dragHandleProps}をつける
                                //<SimpleBar style={{ width: 500, height: 300 }}>
                                                        //<section style={{overflowX: 'scroll'}}>
                                  <div key={index} style={{display: 'flex'}} {...provided.draggableProps} ref={provided.innerRef}>
                                    <div key={index + index} {...provided.dragHandleProps}>
                                      {/*<section style={{overflowX: 'scroll'}}>*/}
                                        <Image file={f}/>
                                      {/*</section>*/}
                                    </div>
                                  </div>
                                //</section>
                              )}
                            </Draggable>
                        );}
                      return null;
                    })}
                    {provided.placeholder}
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
          {location.state.items.type_status !== 0 && location.state.items.type_status !== undefined && (
            <div style={{display: 'flex', alignItems: 'baseline', padding: '0', marginTop: '5px' }}>
              <a className="document_url" href={location.state.items.document_url}>{location.state.items.type_name}</a>
            </div>
          )}
          <hr/>
          <div id="item-detail-erea">
            <label className="label-basic">この商品について</label>
            <textarea id="item-detail" value={detailText}
                   onClick={() => inputDetailClick()}
                   onBlur={() => inputDetailFocusOut()}
                   onChange={(event) => setDetailText(event.target.value)}/>
          </div>
        </div>
        {/*<div style={{marginLeft: '60px', marginTop: '10px'}}>{variKindItem.map((item:any, index:number) => {
                return (
                  <div key={'vari-erea-key' + index}>
                    <button id="vari-erea" onClick={() => clickVariItem(index)}>
                      {item[1] + '/' + item[2] + '/' + item[3] + '/' + item[4]}
                    </button>
                  </div> 
                )
              })}</div>*/}
          <div style={{ marginLeft: '60px', marginTop: '10px' }}>
            {variKindItem.map((item: any, index: number) => {
              if (!item[1] && !item[2] && !item[3] && !item[4]) return null; // null または空文字なら表示しない
                const varis =
                  item[1] +
                  (item[2] !== '' && item[2] !== null ? ' / ' + item[2] : '') +
                  (item[3] !== '' && item[3] !== null ? ' / ' + item[3] : '') +
                  (item[4] !== '' && item[4] !== null ? ' / ' + item[4] : '');
              return (
                <div key={'vari-erea-key' + index}>
                  <button id="vari-erea" onClick={() => clickVariItem(index)}>
                    {varis}
                    {/*{  let a = '';
                       item[1] + 
                     ((item[2] !== '') && (item[2] !== null) ? ' / ' + item[2] : '') +
                     ((item[3] !== '') && (item[3] !== null) ? ' / ' + item[3] : '') +
                     ((item[4] !== '') && (item[4] !== null) ? ' / ' + item[4] : '')
                    }*/}
                  </button>
                </div>
              );
            })}
          </div>
      </div>
    </div>
  );
};
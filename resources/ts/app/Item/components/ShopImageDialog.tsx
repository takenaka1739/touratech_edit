import {
  useCallback,
  useRef,
  useMemo,
  useState,
  useEffect,
} from "react";
import {
  DragDropContext,
  Draggable,
  Droppable,
} from "react-beautiful-dnd";
import { DialogWrapper } from "@/components/DialogWrapper";

export type ShopImageDialogProps = {
  isShown: boolean;
  onClickCancel: () => void;
  onChangeShopImage: (updated: any) => void;
  // ItemDetailPage から渡される props（location.state の置き換え）
  itemName: string | undefined;
  itemPrice: number | null;
  preState: any;
  exDetail: string | undefined;
  preImageItem: any[][];
  imageItem: any[][];
  variItems: any[][];
  preVariItem: any[][];
  variChangeItem: any[][];
  backVariItems: any[][];
  categoryChangeFlag: boolean;
  supplierChangeFlag: boolean;
  delimageItem: any[][];
};

export const ShopImageDialog: React.FC<ShopImageDialogProps> = ({
  isShown,
  onClickCancel,
  onChangeShopImage,
  itemName,
  itemPrice,
  preState,
  exDetail,
  preImageItem,
  imageItem,
  variItems,
  preVariItem,
  variChangeItem,
  backVariItems,
  categoryChangeFlag,
  supplierChangeFlag,
  delimageItem,
}) => {
  // ★ props 全体のログ（既存ロジックに影響なし）
  console.log("【ShopImageDialog props】", { isShown, itemName, preState, exDetail, preImageItem, imageItem, variItems, preVariItem, variChangeItem, backVariItems, categoryChangeFlag, supplierChangeFlag, delimageItem, });
  // ★ preState の中身だけ個別にログ
  console.log("【preState の中身】", preState);
  type Props = {
    file: File;
  };

  const attachRef = useRef<HTMLInputElement>(null);

  const [itemNameInput, setItemNameInput] = useState("");         // 商品名
  const [salesPriceInput, setSalesPriceInput] = useState("");     // 販売価格（税込み）
  const [point, setPoint] = useState("");                         // ポイント
  const [exDetailsInput, setExDetailsInput] = useState("");       // 商品説明（詳細）
  const [movieUrl, setMovieUrl] = useState("");
  const [variKindItem, setVariKindItem] = useState(variItems);
  const [variChangeItemState, setVariChangeItemState] = useState(variChangeItem);
  const [dropErea, setDropErea] = useState("");
  const [selectImageSrc, setImageSrc] = useState("");
  const [selectImageType, setImageType] = useState(-1);
  const [files, setFiles] = useState<any[]>(Array.isArray(imageItem) ? imageItem[0] : [""]);
  const [clicked, setClicked] = useState(false);
  const [SelectImage, setSelectImage] = useState("");
  const [selectId, setSelectId] = useState(Array.isArray(imageItem) && imageItem.length > 0 ? imageItem[0][0] : null);
  const [selectIndex, setSelectIndex] = useState(0);
  const initialMatrix = variItems.map((variItem: any) => {
    let imageRow: any = [[]];
    const hasSameValue = imageItem.some(
      (arr: any) => arr[0] === variItem[0]
    );
    if (hasSameValue) {
      const matchedItems = imageItem.filter(
        (row: any) => row[0] === variItem[0]
      );
      imageRow = [...matchedItems[0]];
    } else {
      const item = [variItem[0], ""];
      imageRow = [...item];
    }
    return Array.isArray(imageRow) ? imageRow : [""];
  });

  const [edtImageItems, setEdtImageItems] = useState<any[][]>(initialMatrix);

  // ダイアログオープン時に最新の値を反映する
  useEffect(() => {
    if (isShown) {
      setItemNameInput(itemName ?? "");                                                   // 商品名
      setSalesPriceInput(itemPrice !== null ? String(itemPrice) : "");                    // 販売価格（税込み）
      if (isShown && itemPrice != null) setPoint(String(Math.floor(itemPrice / 100)));    // ポイント
      setExDetailsInput(exDetail ?? "");                                                  // 商品説明（詳細）
      setVariKindItem(fillNulls(variItems ?? []));                                        // バリエーション
    }
  }, [isShown, itemName, itemPrice, variItems]);
  
  useEffect(() => {
    if (!Array.isArray(imageItem)) {
      if (Array.isArray(variItems) && variItems.length > 0) {
        const initial = variItems.map((value: any) => [
          value[0],
          "",
        ]);
        setEdtImageItems(initial);
        setSelectId(initial[0][0]);
      }
    }
  }, []);

  const [delimageItemState, setDelImageItem] = useState<string[][]>([]);

  // バリエーションの null を直前の値で補完する
  const fillNulls = (items: any[][]) => {
    let last = ["", "", "", ""]; // item[1]〜item[4] の直前値を保持

    return items.map(row => {
      const newRow = [...row];

      for (let i = 1; i <= 4; i++) {
        if (newRow[i] === null) {
          newRow[i] = last[i - 1];
        } else if (newRow[i] !== "") {
          last[i - 1] = newRow[i];
        }
      }

      return newRow;
    });
  };

  const inputPriceFocusOut = () => {
    const updatedItems = variKindItem.map((row: any) => {
      if (row[0] === selectId) {
        const newRow = [...row];
        newRow[6] = salesPriceInput;
        return newRow;
      }
      return row;
    });
    setVariKindItem(updatedItems);

    const updateChangeItems = (() => {
      const exists = variChangeItemState.some(
        (row: any) => row[0] === selectId
      );
      const target = preVariItem.find((row: any) => row[0] === selectId);
      if (target) {
        target[6] = salesPriceInput;
      }

      if (exists) {
        return variChangeItemState.map((row: any) => {
          if (row[0] === selectId) {
            const newRow = [...row];
            newRow[6] = salesPriceInput;
            return newRow;
          }
          return row;
        });
      } else {
        const matched = variKindItem.find(
          (row: any) => row[0] === selectId
        );
        if (matched) {
          const newRow = [...matched];
          newRow[6] = salesPriceInput;
          return [...variChangeItemState, newRow];
        } else {
          return variChangeItemState;
        }
      }
    })();

    setVariChangeItemState(updateChangeItems);

    if (salesPriceInput !== "") {
      setPoint(String(Math.floor(Number(salesPriceInput) / 100)));
    }
  };

  const handleInpuFileChange = useCallback((e: any) => {
    if (e.target.files == null) return;
    const newFiles = Array.from(e.target.files);
    setFiles((current) => current.concat(newFiles));
    if (attachRef.current) attachRef.current.value = "";
  }, []);

  const onDragEnter = useCallback((e: any) => {
    e.preventDefault();
    setDropErea("");
  }, []);

  const onDragLeave = useCallback((e: any) => {
    e.preventDefault();
    setDropErea("");
  }, []);

  const onDragOver = useCallback((e: any) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
    setDropErea("");
  }, []);

  const onDrop = useCallback(
    (e: any) => {
      e.preventDefault();
      e.stopPropagation();

      const addFiles = Array.from(e.dataTransfer.items as DataTransferItemList)
        .map((item) => item.getAsFile())
        .filter((file): file is File => file !== null);

      setFiles((current) =>
        Array.isArray(current)
          ? current.concat(addFiles)
          : [...addFiles]
      );

      if (Array.isArray(edtImageItems)) {
        const item = edtImageItems[selectIndex];

        if (item[0] === selectId) {
          const updatedMatrix = edtImageItems.filter(
            (_, idx) => idx !== selectIndex
          );
          const a = edtImageItems[selectIndex].concat(addFiles);

          if (selectIndex === 0) {
            const withoutFirst = edtImageItems.slice(1);
            const addItem = [a, ...withoutFirst];
            setEdtImageItems(addItem);
          } else {
            const addItem = [
              ...updatedMatrix.slice(0, selectIndex),
              a,
              ...updatedMatrix.slice(selectIndex),
            ];
            setEdtImageItems(addItem);
          }
        } else {
          const a = [selectId, ...addFiles];
          const withoutFirst = edtImageItems.filter(
            (_, i) => i !== selectIndex
          );
          const addItem = [
            ...withoutFirst.slice(0, selectIndex),
            a,
            ...withoutFirst.slice(selectIndex),
          ];
          setEdtImageItems(addItem);
        }
      }

      setDropErea("");
    },
    [edtImageItems, selectId]
  );

  const onPaste = useCallback((e: any) => {
    const file = e.clipboardData.items[0].getAsFile() ?? undefined;
    if (file === undefined) return;
    setFiles((current) => current.concat(file));
    setDropErea("");
  }, []);

  const onDragEnd = (result: any) => {
    const remove = files.splice(result.source.index, 1);
    files.splice(result.destination.index, 0, remove[0]);
  };

  const handleClick = (src: string, type: number, fileName: string) => {
    if (type !== 2) {
      if (src.includes("blob:")) {
        setSelectImage(fileName);
      }
    }
    setImageSrc(src);
    setImageType(type);
    setClicked(true);
  };

  // ダイアログを閉じるときの処理
  const handleClose = () => {
    onChangeShopImage({
      name: itemNameInput,
      sales_price: Number(salesPriceInput),
      point: Number(point),
      explanation_details: exDetailsInput,
    });

    onClickCancel();
  };

  const addMovie = () => {
    if (movieUrl.trim() === "") return;
    setFiles((current) => current.concat(movieUrl));
    setMovieUrl("");

    if (Array.isArray(edtImageItems)) {
      const index = edtImageItems.findIndex(
        (item: any) => item[0] === selectId
      );
      if (index !== -1) {
        const originalItem = edtImageItems[index];
        const updatedItem = [
          originalItem[0],
          ...originalItem.slice(1),
          movieUrl,
        ];
        const updatedMatrix = edtImageItems.map(
          (item: any, idx: number) =>
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
  };

  const removeFileByName = (targetName: string) => {
    edtImageItems.map((item: any, index: number) => {
      let fileItem: string[] = [];
      if (item[0] === files[0]) {
        let delFile = [];

        if (targetName.includes("blob:")) {
          delFile = edtImageItems[index].filter(
            (file: File) => file.name !== SelectImage
          );
        } else {
          delFile = edtImageItems[index].filter(
            (file: string) => file !== targetName
          );
        }

        const updatedMatrix = edtImageItems.filter(
          (_: any, idx: number) => idx !== index
        );
        const addItem = [
          ...updatedMatrix.slice(0, index),
          delFile,
          ...updatedMatrix.slice(index),
        ];

        fileItem.push(item[0], targetName.replace("/images/", ""));
        setEdtImageItems(addItem);
        setFiles(delFile);
        setDelImageItem((prev) => [...prev, fileItem]);
        setImageSrc("");
      }
    });
  };

  const clickVariItem = (index: number) => {
    setSelectIndex(index);
    setSalesPriceInput(variKindItem[index][6]);
    setSelectId(variKindItem[index][0]);

    if (Array.isArray(edtImageItems[index])) {
      setFiles(edtImageItems[index]);
    } else {
      setFiles([]);
    }

    if (Number(variKindItem[index][6]) >= 100)
      setPoint(String(Number(variKindItem[index][6]) / 100));
    else setPoint("0");
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
    <DialogWrapper
      title="ショップイメージ"
      isShown={isShown}
      width="1600px"
      onClickCancel={handleClose}
    >
      <div id="shop-image">
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
                                {(provided) => (
                                  <div key={index} style={{display: 'flex'}} {...provided.draggableProps} ref={provided.innerRef}>
                                    <div key={index + index} {...provided.dragHandleProps}>
                                      <Image file={f}/>
                                    </div>
                                  </div>
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

                <div className="a" style={{display: 'flex', padding: '0px'}}>
                  <input value={movieUrl} onChange={(event) => setMovieUrl(event.target.value)} style={{width: '370px', backgroundColor: 'transparent'}}/>
                  <button style={{width: '80px'}} onClick={() => addMovie()}>追加</button>
                </div>
              </div>
            </div>
          </div>

          <div id="item-info">
            <input
              id="item-name"
              value={itemNameInput}
              placeholder="商品名を入力して下さい"
              onChange={(event) => setItemNameInput(event.target.value)}
            />
            <hr/>
            <div id="price-col">
              <label className="label-basic">￥</label>
              <input
                id="input-price"
                value={salesPriceInput}
                placeholder="金額を入力して下さい"
                onChange={(event) => setSalesPriceInput(event.target.value)}
                onBlur={() => inputPriceFocusOut()}
              />
              <label className="label-basic">（税込み）</label>
            </div>
            <label className="point-label">ポイント：{point}pt</label>

            {/* location.state.items → preState に置き換え */}
            {preState.type_status !== 0 && preState.type_status !== undefined && (
              <div style={{display: 'flex', alignItems: 'baseline', padding: '0', marginTop: '5px', marginBottom: '5px' }}>
                <a className="document_url" href={preState.document_url}>{preState.type_name}</a>
              </div>
            )}

            <hr/>
            <div id="item-detail-erea">
              <label className="label-basic">この商品について</label>
              <textarea
                id="item-detail"
                value={exDetailsInput}
                placeholder="説明文を入力して下さい"
                onChange={(event) => setExDetailsInput(event.target.value)}/>
            </div>
          </div>

          <div style={{ marginLeft: '60px', marginTop: '10px' }}>
            {variKindItem.map((item: any, index: number) => {
              if (!item[1] && !item[2] && !item[3] && !item[4]) return null; // null または空文字なら表示しない
              const varis =
                item[1] +
                (item[2] !== '' && item[2] !== null ? ' / ' + item[2] : '') +
                (item[3] !== '' && item[3] !== null ? ' / ' + item[3] : '') +
                (item[4] !== '' && item[4] !== null ? ' / ' + item[4] : '');
              return (
                <div key={'vari-area-key' + index}>
                  <button id="vari-area" onClick={() => clickVariItem(index)}>
                    {varis}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </DialogWrapper>
  );
};

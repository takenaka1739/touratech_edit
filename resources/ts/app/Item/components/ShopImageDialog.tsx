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
import { ShopImageForm } from "@/app/Item/components/shopImage";

export type ShopImageDialogProps = {
  isShown: boolean;
  onClickCancel: () => void;
  onChangeShopImage: (updated: any) => void;
  preState: any;
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
  preState,
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
  type Props = {
    file: File;
  };

  // 画像・動画一覧をUI表示用の形式に変換
const buildInitialImageMatrix = (variItems: any[][], preImageList: any[] = []) => {
  return variItems.map((vari) => {
    const variId = vari[0];

    const related = preImageList
      .filter((row) => row[1] === variId)
      .sort((a, b) => {
        const sa = a[3];
        const sb = b[3];
        if (sa == null && sb == null) return 0;
        if (sa == null) return 1;
        if (sb == null) return -1;
        return sa - sb;
      });

    if (related.length > 0) {
      const paths = related.map((r) => {
        const fileName = r[2];

        // YouTube はそのまま
        if (typeof fileName === "string" && fileName.includes("youtube.com/embed")) {
          return fileName;
        }

        // File はそのまま返す（URL に変換しない）
        if (fileName instanceof File) {
          return fileName;
        }

        // 通常のファイル名
        return `/images/${fileName}`;
      });

      return [variId, ...paths];
    }

    return [variId];
  });
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
  const [selectImageSrc, setSelectImageSrc] = useState("");
  const [selectImageType, setSelectImageType] = useState(-1);
  const [files, setFiles] = useState<any[]>(Array.isArray(imageItem) ? imageItem[0] : [""]);
  const [clicked, setClicked] = useState(false);
  const [SelectImage, setSelectImage] = useState("");
  const [selectId, setSelectId] = useState(Array.isArray(imageItem) && imageItem.length > 0 ? imageItem[0][0] : null);
  const [selectIndex, setSelectIndex] = useState(0);
  const initialMatrix = buildInitialImageMatrix(variItems, preState.preImageList);
  const sortedMatrix = variItems.map(v => {
    const row = initialMatrix.find(r => r[0] === v[0]);
    return row ?? [v[0]];
  });
  const [edtImageItems, setEdtImageItems] = useState<any[][]>(sortedMatrix);
  const [isImageEdited, setIsImageEdited] = useState(false);
  
  // ダイアログオープン時に最新の値を反映する
  useEffect(() => {
    if (!isShown) return;
    if (variItems.length === 0) return;
    if (initialMatrix.length === 0) return;
    
    console.log("=== 画像初期化開始 ===");
    console.log("variItems:", JSON.parse(JSON.stringify(variItems)));
    console.log("initialMatrix:", JSON.parse(JSON.stringify(initialMatrix)));

    const idx = variItems.findIndex(v => v[0] === preState.id);

    const isVariationEnabled =
      (variItems.length > 1) ||
      (variItems.length === 1 && variItems[0][1] !== "" && variItems[0][1] !== null);

    let initialPrice: number | null = null;
    if (isVariationEnabled && idx !== -1) {
      initialPrice = Number(variItems[idx][6]);
    } else {
      initialPrice = preState.sales_price != null ? Number(preState.sales_price) : null;
    }

    setItemNameInput(preState.name ?? "");
    setSalesPriceInput(initialPrice !== null ? String(initialPrice) : "");
    if (initialPrice != null) setPoint(String(Math.floor(initialPrice / 100)));
    setExDetailsInput(preState.explanation_details ?? "");

    setVariKindItem(fillNulls(variItems ?? []));

    setSelectIndex(idx);
    setSelectId(idx !== -1 ? variItems[idx][0] : null);

    if (idx !== -1 && initialMatrix[idx]) {
      const row = initialMatrix[idx];
      setFiles(row.slice(1));
    }
  }, [isShown, variItems, preState.id, preState.name, preState.sales_price, preState.explanation_details]);

  useEffect(() => {
    if (!isShown) return;

    const initial = variItems.map((v, i) => initialMatrix[i]);
    console.log("edtImageItems 初期化:", initial);
    setEdtImageItems(initial);
  }, [isShown]);

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
    setIsImageEdited(true);
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
            onChangeShopImage({ edtImageItems: addItem, });
          } else {
            const addItem = [
              ...updatedMatrix.slice(0, selectIndex),
              a,
              ...updatedMatrix.slice(selectIndex),
            ];
            setEdtImageItems(addItem);
            onChangeShopImage({ edtImageItems: addItem, });
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
          onChangeShopImage({ edtImageItems: addItem, });
        }
      }

      setDropErea("");
      setIsImageEdited(true);
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
    const newFiles = [...files];
    const [removed] = newFiles.splice(result.source.index, 1);
    newFiles.splice(result.destination.index, 0, removed);

    setFiles(newFiles);

    // edtImageItems の該当行も更新
    const updated = edtImageItems.map((row, idx) =>
      idx === selectIndex ? [row[0], ...newFiles] : row
    );

    setEdtImageItems(updated);

    onChangeShopImage({
      edtImageItems: updated,
    });

    setIsImageEdited(true);
  };

  const handleClick = (src: string, type: number, fileName: string) => {
    if (type !== 2) {
      if (src.includes("blob:")) {
        setSelectImage(fileName);
      }
    }
    setSelectImageSrc(src);
    setSelectImageType(type);
    setClicked(true);
  };

  // ダイアログを閉じるときの処理
  const handleClose = () => {
    // バリエーションが1つだけなら sales_price を更新する
    const updatedSalesPrice = variItems.length === 1 ? Number(salesPriceInput) : preState.sales_price;

    onChangeShopImage({
      name: itemNameInput,
      sales_price: updatedSalesPrice,
      point: Number(point),
      explanation_details: exDetailsInput,
      isImageEdited,
      edtImageItems,
    });

    onClickCancel();
  };

  // YouTubeのURLを埋め込み動画に変換
  const toEmbedUrl = (url: string): string => {
    // iframe タグが貼られた場合
    const iframeMatch = url.match(/src="([^"]+)"/);
    if (iframeMatch) {
      return iframeMatch[1];
    }

    // すでに embed URL の場合
    if (url.includes("youtube.com/embed/")) return url;

    // watch?v= の通常 URL
    const watchMatch = url.match(/v=([^&]+)/);
    if (watchMatch) {
      const videoId = watchMatch[1];
      const listMatch = url.match(/list=([^&]+)/);
      return listMatch
        ? `https://www.youtube.com/embed/${videoId}?list=${listMatch[1]}`
        : `https://www.youtube.com/embed/${videoId}`;
    }

    // youtu.be の短縮 URL
    const shortMatch = url.match(/youtu\.be\/([^?&]+)/);
    if (shortMatch) {
      const videoId = shortMatch[1];
      return `https://www.youtube.com/embed/${videoId}`;
    }

    // どれにも当てはまらない場合はそのまま返す
    return url;
  };

  // 商品イメージに YouTube の追加
  const addMovie = () => {
    if (movieUrl.trim() === "") return;

    const embedUrl = toEmbedUrl(movieUrl);

    setFiles((current) => current.concat(embedUrl));
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
          embedUrl,
        ];
        const updatedMatrix = edtImageItems.map(
          (item: any, idx: number) =>
            idx === index ? updatedItem : item
        );
        setEdtImageItems(updatedMatrix);
        onChangeShopImage({ edtImageItems: updatedMatrix, });
      } else {
        const newItem = [selectId, embedUrl];
        setEdtImageItems([...edtImageItems, newItem]);
      }
    } else {
      const newItem = [selectId, embedUrl];
      setEdtImageItems([newItem]);
    }

    setIsImageEdited(true);
  };

  const removeFileByName = (targetName: string) => {
    // 現在選択中のバリエーションID
    const variId = selectId;

    edtImageItems.map((item: any, index: number) => {
      if (item[0] === variId) {
        let delFile = [];

        if (targetName.includes("blob:")) {
          delFile = item.filter((file: any) => {
            if (file instanceof File) {
              const blobUrl = URL.createObjectURL(file);
              return blobUrl !== targetName;
            }
            return true;
          });
        } else {
          delFile = item.filter((file: any) => file !== targetName);
        }

        const updatedMatrix = edtImageItems.map((row, idx) =>
          idx === index ? delFile : row
        );

        setEdtImageItems(updatedMatrix);
        onChangeShopImage({ edtImageItems: updatedMatrix });
        setFiles(delFile.slice(1));
        setSelectImageSrc("");
        setIsImageEdited(true);
      }
    });
  };

  const clickVariItem = (index: number) => {

    setSelectIndex(index);
    setSalesPriceInput(variKindItem[index][6]);
    setSelectId(variKindItem[index][0]);

    // ポイントの算出
    const price = variKindItem[index][6];
    if (price !== "")
      setPoint(String(Math.floor(Number(price) / 100)));
    else setPoint("0");

    // プレビューの初期化
    setSelectImageSrc("");
    setSelectImageType(-1);

    // サムネイルの差し替え
    const variId = variKindItem[index][0];
    const row = edtImageItems.find(r => r[0] === variId);
    
    if (Array.isArray(row)) {
      const newFiles = row.slice(1).map((fileName: any) => {
        if (fileName instanceof File) return fileName;
        
        if (typeof fileName === "string") {
          if (fileName.includes("youtube.com/embed")) return fileName;
          if (fileName.startsWith("/images/")) return fileName;
          return `/images/${fileName}`;
        }

        return fileName;
      });
      
      setFiles(newFiles);
    } else {
      setFiles([]);
    }
  };

  const Image = ({ file }: Props) => {
    const fileType = typeof file;
    const isBlobLike = file instanceof Blob;

    // Blob（アップロードファイル）の場合
    if (fileType === 'object' && isBlobLike && typeof file !== 'string') {
      const isVideo = typeof file.type === 'string' && file.type.indexOf('video') !== -1;
      const src = useMemo(() => URL.createObjectURL(file), [file]);

      // 画像
      if (!isVideo) {
        return (
          <div style={{ height: '80px', width: '80px', margin: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <img key={src} src={src} onClick={() => handleClick(src, -1, file.name)} alt={file.name} />
          </div>
        );
      }

      // 動画
      return (
        <div
          style={{
            height: '80px',
            width: '80px',
            margin: '10px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative'
          }}
        >
          {/* クリック検知用オーバーレイ（動画の上に透明で重ねる） */}
          <div
            onClick={() => handleClick(src, 1, file.name)}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              cursor: 'pointer',
              zIndex: 2
            }}
          />

          {/* 動画本体（pointerEvents: none を付ける） */}
          <video
            muted
            style={{
              pointerEvents: 'none',
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          >
            <source src={src} type="video/mp4" />
          </video>
        </div>
      );
    }

    // 文字列パス（/images/... や YouTube）
    const src = String(file);
    const isImage = ['jpg', 'gif', 'png'].some(ext => src.includes(ext));
    const isVideo = ['mp4', 'mov'].some(ext => src.includes(ext));

    if (src !== '') {
      // 画像
      if (isImage) {
        return (
          <div style={{ height: '80px', width: '80px', margin: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <img key={src} src={src} onClick={() => handleClick(src, -1, '')} />
          </div>
        );
      }

      // 動画
      if (isVideo) {
        return (
          <div
            style={{
              height: '80px',
              width: '80px',
              margin: '10px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              position: 'relative'
            }}
          >
            {/* クリック検知用オーバーレイ */}
            <div
              onClick={() => handleClick(src, 1, '')}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                cursor: 'pointer',
                zIndex: 2
              }}
            />

            {/* 動画本体 */}
            <video
              muted
              style={{
                pointerEvents: 'none',
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            >
              <source src={src} type="video/mp4" />
            </video>
          </div>
        );
      }

      // YouTube
      return (
        <div style={{ margin: '10px', position: 'relative' }}>
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
          <div
            onClick={() => handleClick(src, 2, '')}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              cursor: 'pointer',
              zIndex: 10
            }}
          />
        </div>
      );
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

            <div className="image-size">
              {/* 画像がまだ選択されていない場合 */}
              {!selectImageSrc ? (
                <div className="no-image-message">
                  画像を選択してください
                </div>
              ) : (
                <>
                  {/* 画像 */}
                  {selectImageType === -1 && (
                    <img
                      key={selectImageType}
                      className="preview-content"
                      src={selectImageSrc}
                    />
                  )}

                  {/* YouTube */}
                  {selectImageType === 2 && clicked && (
                    <iframe
                      key={selectImageType}
                      className="preview-content"
                      src={selectImageSrc}
                      title="YouTube video player"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      referrerPolicy="strict-origin-when-cross-origin"
                      allowFullScreen
                    />
                  )}

                  {/* mp4 動画 */}
                  {selectImageType === 1 && (
                    <video className="preview-content" controls muted>
                      <source src={selectImageSrc} type="video/mp4" />
                    </video>
                  )}
                </>
              )}
            </div>

            <div className="image-input-erea">
              <input type="file" style={{ display: 'none' }} ref={attachRef} multiple onChange={handleInpuFileChange}/>
              <div 
                style={{ height: '115px', width: '550px'}}
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
                        {files.map((f, index) => (
                          <Draggable key={String(index)} draggableId={String(index)} index={index}>
                            {(provided) => (
                              <div
                                key={index}
                                style={{ display: "flex" }}
                                {...provided.draggableProps}
                                ref={provided.innerRef}
                              >
                                <div {...provided.dragHandleProps}>
                                  <Image file={f} />
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                      {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              </div>
            </div>
          </div>

          <div id="item-info">
            <ShopImageForm
              itemNameInput={itemNameInput}
              setItemNameInput={setItemNameInput}
              salesPriceInput={salesPriceInput}
              setSalesPriceInput={setSalesPriceInput}
              point={point}
              preState={preState}
              exDetailsInput={exDetailsInput}
              setExDetailsInput={setExDetailsInput}
              inputPriceFocusOut={inputPriceFocusOut}
            />

            <div className="movie-add-wrapper" style={{ marginTop: "20px", marginLeft: "20px" }}>
              <div className="movie-label" style={{ marginBottom: "5px", fontSize: "18px", color: "#3d3d2b" }}>
                YouTubeリンク
              </div>
              <div className="movie-add-area" style={{ display: "flex", gap: "10px" }}>
                <input value={movieUrl} onChange={(event) => setMovieUrl(event.target.value)}
                  style={{ width: "450px", backgroundColor: 'transparent', border: '1px solid #c9d7e8f8', paddingLeft: '8px', paddingRight: '8px' }}
                />
                <button style={{ width: "80px", backgroundColor: "#c9d7e8f8", border: "1px solid #a0aec0", }} onClick={addMovie}>
                  追加
                </button>
              </div>
            </div>
          </div>

          <div style={{ marginLeft: '60px', marginTop: '10px' }}>
            {variKindItem.map((item: any, index: number) => {
              if (!item[1] && !item[2] && !item[3] && !item[4]) return null;
              const varis =
                item[1] +
                (item[2] !== '' && item[2] !== null ? ' / ' + item[2] : '') +
                (item[3] !== '' && item[3] !== null ? ' / ' + item[3] : '') +
                (item[4] !== '' && item[4] !== null ? ' / ' + item[4] : '');
              return (
                <div key={'vari-area-key' + index}>
                  <button
                    id="vari-area"
                    onClick={() => clickVariItem(index)}
                    style={{
                      backgroundColor: index === selectIndex ? "#a6a014" : "",
                      color: index === selectIndex ? "#ffffff" : "#c2c2c2",
                    }}
                  >
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

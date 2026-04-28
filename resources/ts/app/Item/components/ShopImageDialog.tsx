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

type SettingMode = "common" | "variation";

export const ShopImageDialog: React.FC<ShopImageDialogProps> = ({
  isShown,
  onClickCancel,
  onChangeShopImage,
  preState,
  imageItem,
  variItems,
  variChangeItem,
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

          // File はそのまま返す
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
  const [settingMode, setSettingMode] = useState<SettingMode>("common");
  const [itemNameInput, setItemNameInput] = useState("");
  const [salesPriceInput, setSalesPriceInput] = useState("");
  const [point, setPoint] = useState("");
  const [exDetailsInput, setExDetailsInput] = useState("");
  const [movieUrl, setMovieUrl] = useState("");
  const [variKindItem, setVariKindItem] = useState(variItems);
  const [variChangeItemState, setVariChangeItemState] = useState(variChangeItem);
  const [, setDropErea] = useState("");
  const [selectImageSrc, setSelectImageSrc] = useState("");
  const [selectImageType, setSelectImageType] = useState(-1);
  const [files, setFiles] = useState<any[]>(Array.isArray(imageItem) ? imageItem[0] : [""]);
  const [clicked, setClicked] = useState(false);
  const [, setSelectImage] = useState("");
  const [selectId, setSelectId] = useState(Array.isArray(imageItem) && imageItem.length > 0 ? imageItem[0][0] : null);
  const [selectIndex, setSelectIndex] = useState(0);
  const [isImageEdited, setIsImageEdited] = useState(false);
  const [individualEditedIds, setIndividualEditedIds] = useState<any[]>([]);

  const initialMatrix = buildInitialImageMatrix(variItems, preState.preImageList);

  const sortedMatrix = variItems.map(v => {
    const row = initialMatrix.find(r => r[0] === v[0]);
    return row ?? [v[0]];
  });

  const [edtImageItems, setEdtImageItems] = useState<any[][]>(sortedMatrix);

  const isCommonMode = settingMode === "common";

  // バリエーションの null を直前の値で補完する
  const fillNulls = (items: any[][]) => {
    let last = ["", "", "", ""];

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

  const getVariationLabel = (item: any[]) => {
    return item[1] +
      (item[2] !== "" && item[2] !== null ? " / " + item[2] : "") +
      (item[3] !== "" && item[3] !== null ? " / " + item[3] : "") +
      (item[4] !== "" && item[4] !== null ? " / " + item[4] : "");
  };

  const normalizeImageFiles = (row: any[] | undefined) => {
    if (!Array.isArray(row)) return [];

    return row.slice(1).map((fileName: any) => {
      if (fileName instanceof File) return fileName;

      if (typeof fileName === "string") {
        if (fileName.includes("youtube.com/embed")) return fileName;
        if (fileName.startsWith("/images/")) return fileName;
        return `/images/${fileName}`;
      }

      return fileName;
    });
  };

  const updateImageItemsByFiles = (newFiles: any[]) => {
    const targetIds = getTargetVariationIds();

    const updatedMatrix = variKindItem.map((row: any) => {
      const variId = row[0];
      const exists = edtImageItems.find((imageRow: any) => imageRow[0] === variId);

      if (targetIds.includes(variId)) {
        return [variId, ...newFiles];
      }

      return exists ?? [variId];
    });

    if (!isCommonMode && selectId !== null && selectId !== undefined) {
      setIndividualEditedIds((prev) => (
        prev.includes(selectId) ? prev : [...prev, selectId]
      ));
    }

    setFiles(newFiles);
    setEdtImageItems(updatedMatrix);
    setIsImageEdited(true);

    onChangeShopImage({
      isImageEdited: true,
      edtImageItems: updatedMatrix,
    });
  };

  const updateVariationPrice = (targetIds: any[], price: string) => {
    const fixedTargetIds = targetIds;

    const updatedItems = variKindItem.map((row: any) => {
      if (fixedTargetIds.includes(row[0])) {
        const newRow = [...row];
        newRow[6] = price;
        return newRow;
      }
      return row;
    });

    setVariKindItem(updatedItems);

    const updatedChangeItems = (() => {
      let result = [...variChangeItemState];

      fixedTargetIds.forEach((targetId: any) => {
        const exists = result.some((row: any) => row[0] === targetId);
        const baseRow = updatedItems.find((row: any) => row[0] === targetId);

        if (exists) {
          result = result.map((row: any) => {
            if (row[0] === targetId) {
              const newRow = [...row];
              newRow[6] = price;
              return newRow;
            }
            return row;
          });
        } else if (baseRow) {
          result = [...result, [...baseRow]];
        }
      });

      return result;
    })();

    if (!isCommonMode && selectId !== null && selectId !== undefined) {
      setIndividualEditedIds((prev) => (
        prev.includes(selectId) ? prev : [...prev, selectId]
      ));
    }

    setVariChangeItemState(updatedChangeItems);

    onChangeShopImage({
      variItems: updatedItems,
      variChangeItem: updatedChangeItems,
      variChangeItemState: updatedChangeItems,
    });

    setPoint(price !== "" ? String(Math.floor(Number(price) / 100)) : "0");
  };

  // ダイアログオープン時に最新の値を反映する
  useEffect(() => {
    if (!isShown) return;
    if (variItems.length === 0) return;

    const initialIndex = 0;
    const initialPrice =
      variItems[initialIndex]?.[6] != null && variItems[initialIndex]?.[6] !== ""
        ? Number(variItems[initialIndex][6])
        : preState.sales_price != null
          ? Number(preState.sales_price)
          : null;

    setSettingMode("common");
    setItemNameInput(preState.name ?? "");
    setSalesPriceInput(initialPrice !== null ? String(initialPrice) : "");
    setPoint(initialPrice !== null ? String(Math.floor(initialPrice / 100)) : "0");
    setExDetailsInput(preState.explanation_details ?? "");

    const filledVariItems = fillNulls(variItems ?? []);
    setVariKindItem(filledVariItems);
    setVariChangeItemState(variChangeItem ?? []);

    setSelectIndex(initialIndex);
    setSelectId(variItems[initialIndex]?.[0] ?? null);

    const initial = variItems.map((v) => {
      const row = initialMatrix.find(r => r[0] === v[0]);
      return row ?? [v[0]];
    });

    setEdtImageItems(initial);

    if (initial[initialIndex]) {
      setFiles(normalizeImageFiles(initial[initialIndex]));
    } else {
      setFiles([]);
    }

    setSelectImageSrc("");
    setSelectImageType(-1);
    setIsImageEdited(false);
  }, [isShown, variItems, preState.id, preState.name, preState.sales_price, preState.explanation_details]);

  const inputPriceFocusOut = () => {
    const targetIds = isCommonMode
      ? variKindItem.map((row: any) => row[0])
      : [selectId];

    updateVariationPrice(targetIds, salesPriceInput);
  };

  const handleInpuFileChange = useCallback((e: any) => {
    if (e.target.files == null) return;

    const newFiles = files.concat(Array.from(e.target.files));
    updateImageItemsByFiles(newFiles);

    if (attachRef.current) attachRef.current.value = "";
  }, [files, edtImageItems, selectId, settingMode, variKindItem]);

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

      updateImageItemsByFiles(files.concat(addFiles));
      setDropErea("");
    },
    [files, edtImageItems, selectId, settingMode, variKindItem]
  );

  const onPaste = useCallback((e: any) => {
    const file = e.clipboardData.items[0].getAsFile() ?? undefined;
    if (file === undefined) return;

    updateImageItemsByFiles(files.concat(file));
    setDropErea("");
  }, [files, edtImageItems, selectId, settingMode, variKindItem]);

  const onDragEnd = (result: any) => {
    if (!result.destination) return;

    const newFiles = [...files];
    const [removed] = newFiles.splice(result.source.index, 1);
    newFiles.splice(result.destination.index, 0, removed);

    updateImageItemsByFiles(newFiles);
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
    const updatedSalesPrice = variItems.length === 1 ? Number(salesPriceInput) : preState.sales_price;

    onChangeShopImage({
      name: itemNameInput,
      sales_price: updatedSalesPrice,
      point: Number(point),
      explanation_details: exDetailsInput,
      isImageEdited,
      edtImageItems,
      variChangeItem: variChangeItemState,
    });

    onClickCancel();
  };

  // YouTubeのURLを埋め込み動画に変換
  const toEmbedUrl = (url: string): string => {
    const iframeMatch = url.match(/src="([^"]+)"/);
    if (iframeMatch) {
      return iframeMatch[1];
    }

    if (url.includes("youtube.com/embed/")) return url;

    const watchMatch = url.match(/v=([^&]+)/);
    if (watchMatch) {
      const videoId = watchMatch[1];
      const listMatch = url.match(/list=([^&]+)/);
      return listMatch
        ? `https://www.youtube.com/embed/${videoId}?list=${listMatch[1]}`
        : `https://www.youtube.com/embed/${videoId}`;
    }

    const shortMatch = url.match(/youtu\.be\/([^?&]+)/);
    if (shortMatch) {
      const videoId = shortMatch[1];
      return `https://www.youtube.com/embed/${videoId}`;
    }

    return url;
  };

  // 商品イメージに YouTube の追加
  const addMovie = () => {
    if (movieUrl.trim() === "") return;

    const embedUrl = toEmbedUrl(movieUrl);
    updateImageItemsByFiles(files.concat(embedUrl));
    setMovieUrl("");
  };

  const removeFileByName = (targetName: string) => {
    const newFiles = files.filter((file: any) => {
      if (targetName.includes("blob:")) {
        if (file instanceof File) {
          const blobUrl = URL.createObjectURL(file);
          return blobUrl !== targetName;
        }
        return true;
      }

      return file !== targetName;
    });

    updateImageItemsByFiles(newFiles);
    setSelectImageSrc("");
  };

  const clickCommonSetting = () => {
    setSettingMode("common");

    const commonPrice =
      variKindItem[0]?.[6] != null && variKindItem[0]?.[6] !== ""
        ? variKindItem[0][6]
        : preState.sales_price ?? "";

    setSalesPriceInput(String(commonPrice));
    setPoint(commonPrice !== "" ? String(Math.floor(Number(commonPrice) / 100)) : "0");

    const firstRow = edtImageItems.find((row: any) => row[0] === variKindItem[0]?.[0]);
    setFiles(normalizeImageFiles(firstRow));
    setSelectImageSrc("");
    setSelectImageType(-1);
  };

  const clickVariItem = (index: number) => {
    setSettingMode("variation");
    setSelectIndex(index);
    setSalesPriceInput(variKindItem[index][6]);
    setSelectId(variKindItem[index][0]);

    const price = variKindItem[index][6];
    if (price !== "") {
      setPoint(String(Math.floor(Number(price) / 100)));
    } else {
      setPoint("0");
    }

    setSelectImageSrc("");
    setSelectImageType(-1);

    const variId = variKindItem[index][0];
    const row = edtImageItems.find(r => r[0] === variId);
    setFiles(normalizeImageFiles(row));
  };

  const Image = ({ file }: Props) => {
    const fileType = typeof file;
    const isBlobLike = file instanceof Blob;

    if (fileType === "object" && isBlobLike && typeof file !== "string") {
      const isVideo = typeof file.type === "string" && file.type.indexOf("video") !== -1;
      const src = useMemo(() => URL.createObjectURL(file), [file]);

      if (!isVideo) {
        return (
          <div style={{ height: "80px", width: "80px", margin: "10px", display: "flex", justifyContent: "center", alignItems: "center" }}>
            <img key={src} src={src} onClick={() => handleClick(src, -1, file.name)} alt={file.name} />
          </div>
        );
      }

      return (
        <div style={{ height: "80px", width: "80px", margin: "10px", display: "flex", justifyContent: "center", alignItems: "center", position: "relative" }}>
          <div
            onClick={() => handleClick(src, 1, file.name)}
            style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", cursor: "pointer", zIndex: 2 }}
          />

          <video muted style={{ pointerEvents: "none", width: "100%", height: "100%", objectFit: "cover" }}>
            <source src={src} type="video/mp4" />
          </video>
        </div>
      );
    }

    const src = String(file);
    const lower = src.toLowerCase();
    const isImage = ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"].some(ext => lower.includes(ext));
    const isVideo = ["mp4", "mov"].some(ext => lower.includes(ext));

    if (src !== "") {
      if (isImage) {
        return (
          <div style={{ height: "80px", width: "80px", margin: "10px", display: "flex", justifyContent: "center", alignItems: "center" }}>
            <img key={src} src={src} onClick={() => handleClick(src, -1, "")} />
          </div>
        );
      }

      if (isVideo) {
        return (
          <div style={{ height: "80px", width: "80px", margin: "10px", display: "flex", justifyContent: "center", alignItems: "center", position: "relative" }}>
            <div
              onClick={() => handleClick(src, 1, "")}
              style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", cursor: "pointer", zIndex: 2 }}
            />

            <video muted style={{ pointerEvents: "none", width: "100%", height: "100%", objectFit: "cover" }}>
              <source src={src} type="video/mp4" />
            </video>
          </div>
        );
      }

      return (
        <div style={{ margin: "10px", position: "relative" }}>
          <iframe
            width="80px"
            height="80px"
            src={src}
            style={{ pointerEvents: "none" }}
            title="YouTube video player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
          <div
            onClick={() => handleClick(src, 2, "")}
            style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", cursor: "pointer", zIndex: 10 }}
          />
        </div>
      );
    }

    return null;
  };

  const hasVisibleFiles = Array.isArray(files) && files.filter(Boolean).length > 0;

  const getTargetVariationIds = () => {
    if (!isCommonMode) {
      return [selectId];
    }

    return variKindItem
      .map((row: any) => row[0])
      .filter((id: any) => !individualEditedIds.includes(id));
  };

  return (
    <DialogWrapper
      title="ショップイメージ"
      isShown={isShown}
      width="1600px"
      onClickCancel={handleClose}
    >
      <div id="shop-image">
        <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
          <button
            type="button"
            onClick={clickCommonSetting}
            style={{
              padding: "6px 18px",
              border: "1px solid #a0aec0",
              backgroundColor: isCommonMode ? "#a6a014" : "#ffffff",
              color: isCommonMode ? "#ffffff" : "#333333",
            }}
          >
            共通設定
          </button>
          <button
            type="button"
            onClick={() => clickVariItem(selectIndex)}
            style={{
              padding: "6px 18px",
              border: "1px solid #a0aec0",
              backgroundColor: !isCommonMode ? "#a6a014" : "#ffffff",
              color: !isCommonMode ? "#ffffff" : "#333333",
            }}
          >
            バリエーション別設定
          </button>
          <div style={{ display: "flex", alignItems: "center", color: "#666666", fontSize: "13px" }}>
            {isCommonMode
              ? "共通設定で追加した画像・価格は全バリエーションに反映されます。"
              : "選択中のバリエーションだけに画像・価格を反映します。"}
          </div>
        </div>

        <div id="input-area">
          <div id="image-area">
            <button
              className="btn-delete"
              style={{ marginLeft: "495px", marginBottom: "5px", height: "26px", paddingTop: "0px", paddingBottom: "0px", whiteSpace: "nowrap" }}
              onClick={() => removeFileByName(selectImageSrc)}
            >
              削除
            </button>

            <div id="main-img">
              {!selectImageSrc ? (
                <div className="no-image-message">
                  画像を選択してください
                </div>
              ) : (
                <>
                  {selectImageType === -1 && (
                    <img
                      key={selectImageType}
                      className="preview-content"
                      src={selectImageSrc}
                    />
                  )}

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

                  {selectImageType === 1 && (
                    <video className="preview-content" controls muted>
                      <source src={selectImageSrc} type="video/mp4" />
                    </video>
                  )}
                </>
              )}
            </div>

            <div className="image-input-erea">
              <input
                type="file"
                style={{ display: "none" }}
                ref={attachRef}
                multiple
                onChange={handleInpuFileChange}
              />
              <div
                style={{
                  height: "115px",
                  width: "550px",
                  position: "relative",
                  border: "1px dashed #c9d7e8",
                  borderRadius: "6px",
                  backgroundColor: "#fafcff",
                }}
                tabIndex={0}
                onDragEnter={onDragEnter}
                onDragLeave={onDragLeave}
                onDragOver={onDragOver}
                onDrop={onDrop}
                onPaste={onPaste}
              >
                {!hasVisibleFiles && (
                  <div
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      zIndex: 10,
                      pointerEvents: "none",
                      fontSize: "20px",
                      fontWeight: 600,
                      color: "#6f88a8",
                      whiteSpace: "nowrap",
                    }}
                  >
                    ここにドロップ
                  </div>
                )}

                <DragDropContext onDragEnd={onDragEnd}>
                  <Droppable key="droppable" droppableId="droppable" direction="horizontal">
                    {(provided) => (
                      <div
                        key="scllowDiv"
                        className="scllowDiv"
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        style={{
                          position: "absolute",
                          inset: 0,
                          zIndex: 1,
                          display: "flex",
                          alignItems: "center",
                          overflowX: "auto",
                        }}
                      >
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
              <div
                className="movie-label tooltip"
                style={{ marginBottom: "5px", fontSize: "18px", color: "#3d3d2b" }}
                data-tooltip="YouTube リンクは、以下のいずれかの方法で URL を取得して追加してください。
                              取得方法１：動画再生ページの URL（https://www.youtube.com/watch～）
                              取得方法２：動画上でマウス右クリック > 埋め込みコードをコピー > メモ帳に張り付け > srcの部分（https://www.youtube.com/embed/～）"
              >
                YouTubeリンク
              </div>
              <div className="movie-add-area" style={{ display: "flex", gap: "10px" }}>
                <input
                  value={movieUrl}
                  onChange={(event) => setMovieUrl(event.target.value)}
                  style={{ width: "450px", backgroundColor: "transparent", border: "1px solid #c9d7e8f8", paddingLeft: "8px", paddingRight: "8px" }}
                />
                <button
                  style={{ width: "80px", backgroundColor: "#c9d7e8f8", border: "1px solid #a0aec0" }}
                  onClick={addMovie}
                >
                  追加
                </button>
              </div>
            </div>
          </div>

          <div style={{ marginLeft: "60px", marginTop: "10px" }}>
            {variKindItem.map((item: any, index: number) => {
              if (!item[1] && !item[2] && !item[3] && !item[4]) return null;

              return (
                <div key={"vari-area-key" + index}>
                  <button
                    id="vari-area"
                    onClick={() => clickVariItem(index)}
                    style={{
                      backgroundColor: !isCommonMode && index === selectIndex ? "#a6a014" : "",
                      color: !isCommonMode && index === selectIndex ? "#ffffff" : "#c2c2c2",
                    }}
                  >
                    {getVariationLabel(item)}
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
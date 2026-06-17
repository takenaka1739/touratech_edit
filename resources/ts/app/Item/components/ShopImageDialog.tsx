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
    file: any;
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
  const wasShownRef = useRef(false);
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
  const [selectedMediaIndex, setSelectedMediaIndex] = useState<number | null>(null);
  const [selectedMediaItem, setSelectedMediaItem] = useState<any>(null);
  const [files, setFiles] = useState<any[]>(Array.isArray(imageItem) ? imageItem[0] : [""]);
  const [commonFiles, setCommonFiles] = useState<any[]>([]);
  const [clicked, setClicked] = useState(false);
  const [, setSelectImage] = useState("");
  const [selectId, setSelectId] = useState(Array.isArray(imageItem) && imageItem.length > 0 ? imageItem[0][0] : null);
  const [selectIndex, setSelectIndex] = useState(0);
  const [isImageEdited, setIsImageEdited] = useState(false);
  const [individualEditedIds, setIndividualEditedIds] = useState<any[]>([]);

  const getCurrentShopImageSelection = (
    mode: SettingMode = settingMode,
    index: number = selectIndex,
    id: any = selectId
  ) => ({
    shopImageSettingMode: mode,
    shopImageSelectIndex: index,
    shopImageSelectId: id,
  });

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

  const normalizeStandaloneImageFiles = (row: any[] | undefined) => {
    if (!Array.isArray(row)) return [];

    return row.map((fileName: any) => {
      if (fileName instanceof File) return fileName;

      if (typeof fileName === "string") {
        if (fileName.includes("youtube.com/embed")) return fileName;
        if (fileName.startsWith("/images/")) return fileName;
        return `/images/${fileName}`;
      }

      return fileName;
    });
  };

  const getMediaKey = (file: any) => {
    if (file instanceof File) {
      return `file:${file.name}:${file.size}:${file.lastModified}`;
    }

    if (file instanceof Blob) {
      return `blob:${file.size}:${file.type}`;
    }

    if (typeof file === "string") {
      if (file.includes("youtube.com/embed")) return file;
      if (file.startsWith("/images/")) return file;
      return `/images/${file}`;
    }

    return String(file);
  };

  const isCommonLockedMedia = (file: any) => {
    if (isCommonMode) return false;
    const commonKeys = new Set(commonFiles.filter(Boolean).map(getMediaKey));
    return commonKeys.has(getMediaKey(file));
  };

  const filterOutCommonFiles = (sourceFiles: any[], baseCommonFiles: any[]) => {
    const commonKeys = new Set(baseCommonFiles.filter(Boolean).map(getMediaKey));
    return sourceFiles.filter((file: any) => !commonKeys.has(getMediaKey(file)));
  };

  const getVisibleFiles = (
    mode: SettingMode = settingMode,
    targetId: any = selectId,
    matrix: any[][] = edtImageItems,
    common: any[] = commonFiles
  ) => {
    if (mode === "common") return common;

    const row = matrix.find((imageRow: any) => imageRow[0] === targetId);
    return [
      ...common,
      ...filterOutCommonFiles(normalizeImageFiles(row), common),
    ];
  };

  const updateImageItemsByFiles = (newFiles: any[]) => {
    const targetIds = getTargetVariationIds();
    const commonCompareFiles = isCommonMode
      ? [...commonFiles, ...newFiles]
      : commonFiles;
    const individualFiles = filterOutCommonFiles(newFiles, commonCompareFiles);

    const updatedMatrix = variKindItem.map((row: any) => {
      const variId = row[0];
      const exists = edtImageItems.find((imageRow: any) => imageRow[0] === variId);

      if (isCommonMode) {
        const existingFiles = normalizeImageFiles(exists);
        const preservedIndividualFiles = filterOutCommonFiles(existingFiles, commonCompareFiles);
        return [variId, ...preservedIndividualFiles];
      }

      if (targetIds.includes(variId)) {
        return [variId, ...individualFiles];
      }

      return exists ?? [variId];
    });

    if (!isCommonMode && selectId !== null && selectId !== undefined) {
      setIndividualEditedIds((prev) => (
        prev.includes(selectId) ? prev : [...prev, selectId]
      ));
    }

    if (isCommonMode) {
      setCommonFiles(newFiles);
    }

    setFiles(isCommonMode ? newFiles : [...commonFiles, ...individualFiles]);
    setEdtImageItems(updatedMatrix);
    setIsImageEdited(true);

    onChangeShopImage({
      isImageEdited: true,
      edtImageItems: updatedMatrix,
      commonImageList: isCommonMode ? newFiles : commonFiles,
      ...getCurrentShopImageSelection(),
    });
  };

  useEffect(() => {
    if (!isShown) return;
    if (!wasShownRef.current) return;

    setFiles(getVisibleFiles());
  }, [isShown, settingMode, selectId, edtImageItems, commonFiles]);

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
    if (!isShown) {
      wasShownRef.current = false;
      return;
    }
    if (wasShownRef.current) return;
    wasShownRef.current = true;
    if (variItems.length === 0) return;

    const restoredMode: SettingMode = preState.shopImageSettingMode === "variation" ? "variation" : "common";
    const restoredIndex =
      Number.isInteger(preState.shopImageSelectIndex) &&
      preState.shopImageSelectIndex >= 0 &&
      preState.shopImageSelectIndex < variItems.length
        ? preState.shopImageSelectIndex
        : 0;
    const restoredSelectId = preState.shopImageSelectId ?? variItems[restoredIndex]?.[0] ?? null;
    const initialIndex = restoredIndex;
    const initialPrice =
      variItems[initialIndex]?.[6] != null && variItems[initialIndex]?.[6] !== ""
        ? Number(variItems[initialIndex][6])
        : preState.sales_price != null
          ? Number(preState.sales_price)
          : null;

    setSettingMode(restoredMode);
    setItemNameInput(preState.name ?? "");
    setSalesPriceInput(initialPrice !== null ? String(initialPrice) : "");
    setPoint(initialPrice !== null ? String(Math.floor(initialPrice / 100)) : "0");
    setExDetailsInput(preState.explanation_details ?? "");

    const filledVariItems = fillNulls(variItems ?? []);
    setVariKindItem(filledVariItems);
    setVariChangeItemState(variChangeItem ?? []);

    setSelectIndex(initialIndex);
    setSelectId(restoredSelectId);

    const initial = variItems.map((v) => {
      const row = initialMatrix.find(r => r[0] === v[0]);
      return row ?? [v[0]];
    });

    setEdtImageItems(initial);

    const initialCommonFiles = normalizeStandaloneImageFiles(preState.commonImageList);
    setCommonFiles(initialCommonFiles);
    setFiles(getVisibleFiles(restoredMode, restoredSelectId, initial, initialCommonFiles));

    setSelectImageSrc("");
    setSelectImageType(-1);
    setSelectedMediaIndex(null);
    setSelectedMediaItem(null);
    setIsImageEdited(false);
    setIndividualEditedIds([]);
  }, [isShown, variItems, preState.id, preState.name, preState.sales_price, preState.explanation_details, preState.commonImageList, preState.shopImageSettingMode, preState.shopImageSelectIndex, preState.shopImageSelectId]);

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
    if (!isCommonMode && isCommonLockedMedia(files[result.source.index])) return;

    let newFiles = [...files];

    if (!isCommonMode) {
      const lockedFiles = newFiles.filter(isCommonLockedMedia);
      const editableFiles = newFiles.filter((file: any) => !isCommonLockedMedia(file));
      const lockedCount = lockedFiles.length;
      const sourceIndex = result.source.index - lockedCount;
      const destinationIndex = Math.max(0, result.destination.index - lockedCount);

      if (sourceIndex < 0) return;

      const [removed] = editableFiles.splice(sourceIndex, 1);
      editableFiles.splice(destinationIndex, 0, removed);
      newFiles = [...lockedFiles, ...editableFiles];
    } else {
      const [removed] = newFiles.splice(result.source.index, 1);
      newFiles.splice(result.destination.index, 0, removed);
    }

    updateImageItemsByFiles(newFiles);
  };

  const handleClick = (src: string, type: number, fileName: string, index: number, mediaItem: any) => {
    if (type !== 2) {
      if (src.includes("blob:")) {
        setSelectImage(fileName);
      }
    }
    setSelectImageSrc(src);
    setSelectImageType(type);
    setSelectedMediaIndex(index);
    setSelectedMediaItem(mediaItem);
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
      commonImageList: commonFiles,
      ...getCurrentShopImageSelection(),
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

  const removeSelectedFile = () => {
    if (!selectImageSrc) return;
    if (selectedMediaItem !== null && isCommonLockedMedia(selectedMediaItem)) return;
    if (selectedMediaIndex !== null && isCommonLockedMedia(files[selectedMediaIndex])) return;

    const newFiles = selectedMediaItem !== null
      ? files.filter((file: any) => file !== selectedMediaItem)
      : selectedMediaIndex !== null
      ? files.filter((_: any, index: number) => index !== selectedMediaIndex)
      : files.filter((file: any) => file !== selectImageSrc);

    updateImageItemsByFiles(newFiles);
    setSelectImageSrc("");
    setSelectImageType(-1);
    setSelectedMediaIndex(null);
    setSelectedMediaItem(null);
  };

  const clickCommonSetting = () => {
    setSettingMode("common");

    const commonPrice =
      variKindItem[0]?.[6] != null && variKindItem[0]?.[6] !== ""
        ? variKindItem[0][6]
        : preState.sales_price ?? "";

    setSalesPriceInput(String(commonPrice));
    setPoint(commonPrice !== "" ? String(Math.floor(Number(commonPrice) / 100)) : "0");

    setFiles(getVisibleFiles("common"));
    setSelectImageSrc("");
    setSelectImageType(-1);
    setSelectedMediaIndex(null);
    setSelectedMediaItem(null);

    onChangeShopImage(getCurrentShopImageSelection("common"));
  };

  const clickVariItem = (index: number) => {
    const variId = variKindItem[index][0];
    setSettingMode("variation");
    setSelectIndex(index);
    setSalesPriceInput(variKindItem[index][6]);
    setSelectId(variId);

    const price = variKindItem[index][6];
    if (price !== "") {
      setPoint(String(Math.floor(Number(price) / 100)));
    } else {
      setPoint("0");
    }

    setSelectImageSrc("");
    setSelectImageType(-1);
    setSelectedMediaIndex(null);
    setSelectedMediaItem(null);

    setFiles(getVisibleFiles("variation", variId));

    onChangeShopImage(getCurrentShopImageSelection("variation", index, variId));
  };

  const Image = ({ file, index }: Props & { index: number }) => {
    const fileType = typeof file;
    const isBlobLike = file instanceof Blob;
    const isLocked = isCommonLockedMedia(file);
    const frameStyle = {
      height: "80px",
      width: "80px",
      margin: "10px",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      position: "relative" as const,
    };
    const mediaStyle = isLocked
      ? { opacity: 0.45, filter: "grayscale(20%) brightness(1.25)" }
      : {};
    const lockOverlay = isLocked ? (
      <>
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "rgba(255, 255, 255, 0.45)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "4px",
            left: "4px",
            padding: "1px 5px",
            borderRadius: "3px",
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            border: "1px solid #9aa8b8",
            color: "#3f4a5a",
            fontSize: "11px",
            lineHeight: "16px",
            pointerEvents: "none",
          }}
        >
          共通
        </div>
      </>
    ) : null;

    if (fileType === "object" && isBlobLike && typeof file !== "string") {
      const isVideo = typeof file.type === "string" && file.type.indexOf("video") !== -1;
      const src = useMemo(() => URL.createObjectURL(file), [file]);

      if (!isVideo) {
        return (
          <div style={frameStyle}>
            <img key={src} src={src} onClick={() => handleClick(src, -1, file.name, index, file)} alt={file.name} style={mediaStyle} />
            {lockOverlay}
          </div>
        );
      }

      return (
        <div style={frameStyle}>
          <div
            onClick={() => handleClick(src, 1, file.name, index, file)}
            style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", cursor: "pointer", zIndex: 2 }}
          />

          <video muted style={{ pointerEvents: "none", width: "100%", height: "100%", objectFit: "cover", ...mediaStyle }}>
            <source src={src} type="video/mp4" />
          </video>
          {lockOverlay}
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
          <div style={frameStyle}>
            <img key={src} src={src} onClick={() => handleClick(src, -1, "", index, file)} style={mediaStyle} />
            {lockOverlay}
          </div>
        );
      }

      if (isVideo) {
        return (
          <div style={frameStyle}>
            <div
              onClick={() => handleClick(src, 1, "", index, file)}
              style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", cursor: "pointer", zIndex: 2 }}
            />

            <video muted style={{ pointerEvents: "none", width: "100%", height: "100%", objectFit: "cover", ...mediaStyle }}>
              <source src={src} type="video/mp4" />
            </video>
            {lockOverlay}
          </div>
        );
      }

      return (
        <div style={{ ...frameStyle }}>
          <iframe
            width="80px"
            height="80px"
            src={src}
            style={{ pointerEvents: "none", ...mediaStyle }}
            title="YouTube video player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
          <div
            onClick={() => handleClick(src, 2, "", index, file)}
            style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", cursor: "pointer", zIndex: 10 }}
          />
          {lockOverlay}
        </div>
      );
    }

    return null;
  };

  const hasVisibleFiles = Array.isArray(files) && files.filter(Boolean).length > 0;
  const isSelectedMediaLocked =
    !isCommonMode &&
    (
      (selectedMediaItem !== null && isCommonLockedMedia(selectedMediaItem)) ||
      (selectedMediaIndex !== null && isCommonLockedMedia(files[selectedMediaIndex]))
    );

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
              style={{
                marginLeft: "495px",
                marginBottom: "5px",
                height: "26px",
                paddingTop: "0px",
                paddingBottom: "0px",
                whiteSpace: "nowrap",
                opacity: isSelectedMediaLocked ? 0.45 : 1,
                cursor: isSelectedMediaLocked ? "not-allowed" : "pointer",
              }}
              onClick={removeSelectedFile}
              disabled={isSelectedMediaLocked}
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
                          <Draggable
                            key={String(index)}
                            draggableId={String(index)}
                            index={index}
                            isDragDisabled={isCommonLockedMedia(f)}
                          >
                            {(provided) => (
                              <div
                                key={index}
                                style={{ display: "flex" }}
                                {...provided.draggableProps}
                                ref={provided.innerRef}
                              >
                                <div {...provided.dragHandleProps}>
                                  <Image file={f} index={index} />
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

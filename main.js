document.addEventListener('DOMContentLoaded', () => {
    generateUUID('pack-uuid');
    generateUUID('module-uuid');
    const fileInput = document.getElementById('skin-image');
    const fileNameLabel = document.getElementById('fileName');
    fileInput.addEventListener('change', handleFileSelect);

    document.addEventListener('contextmenu', function(event) {
        if (event.target.tagName !== 'INPUT' || event.target.type !== 'text') {
            event.preventDefault();
        }
    });
    document.querySelectorAll('img').forEach(img => {
        img.addEventListener('dragstart', event => event.preventDefault());
    });
});

//skinDataの配列
let skinData = [];

function generateUUID(elementId) {
    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
    document.getElementById(elementId).value = uuid;
}

function handleFileSelect(event) {
    const files = event.target.files;
    const container = document.getElementById('skinPreview');

    Array.from(files).forEach((file, index) => {
        if (!file.type.startsWith('image/')) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const skinInfo = document.createElement('div');
            skinInfo.classList.add('skin-settings');
            const newSkinData = {
                id: skinData.length,
                name: '',
                armType: 'default',
                animationType: false,
                hideArmor: false,
                file: file,
                imgSrc: e.target.result
            };
            skinData.push(newSkinData);
            skinInfo.innerHTML = `
                <img src="${newSkinData.imgSrc}" alt="Skin Preview" class="skin-preview" style="width:64px; height:64px; margin-right:10px;">
                <input type="text" placeholder="スキン名を入力" data-id="${newSkinData.id}" class="skin-name">
                <div>
                    <label for="arm-type-${newSkinData.id}">腕のタイプ:</label>
                    <select id="arm-type-${newSkinData.id}" data-id="${newSkinData.id}" class="arm-type">
                        <option value="default">デフォルト</option>
                        <option value="slim">スリム</option>
                    </select>
                </div>
                <div>
                    <label for="animation-${newSkinData.id}">アニメーションを追加:</label>
                    <select id="animation-${newSkinData.id}" data-id="${newSkinData.id}" class="animation-type">
                        <option value="false" selected>いいえ</option>
                        <option value="true">はい</option>
                    </select>
                </div>
                <label>
                    <input type="checkbox" id="hide-armor-${newSkinData.id}" data-id="${newSkinData.id}" class="hide-armor"> 防具を非表示
                </label>
                <button type="button" class="delete-skin" data-id="${newSkinData.id}">🗑️</button>
            `;
            container.appendChild(skinInfo);
            const deleteButton = skinInfo.querySelector('.delete-skin');
            deleteButton.addEventListener('click', function () {
                const skinId = parseInt(this.getAttribute('data-id'));
                if (confirm('このスキンを削除しますか？')) {
                    deleteSkin(skinId);
                }
            });
            updateSkinData(newSkinData.id, e.target.result, file);
        };
        reader.readAsDataURL(file);
    });
}

function updateSkinData(id, imgSrc, file) {
    const skin = skinData.find(s => s.id === id);
    skin.imgSrc = imgSrc;
    skin.file = file;
    const skinNameInput = document.querySelector(`input.skin-name[data-id="${id}"]`);
    const armTypeSelect = document.querySelector(`select.arm-type[data-id="${id}"]`);
    const animationTypeSelect = document.querySelector(`select.animation-type[data-id="${id}"]`);
    const hideArmorCheckbox = document.querySelector(`input.hide-armor[data-id="${id}"]`);
    skinNameInput.addEventListener('input', () => skin.name = skinNameInput.value);
    armTypeSelect.addEventListener('change', () => skin.armType = armTypeSelect.value);
    animationTypeSelect.addEventListener('change', () => skin.animationType = animationTypeSelect.value === 'true');
    hideArmorCheckbox.addEventListener('change', () => skin.hideArmor = hideArmorCheckbox.checked);
}

//skinDataから削除
function deleteSkin(id) {
    skinData = skinData.filter(skin => skin.id !== id);
    const skinElement = document.querySelector(`.skin-settings input[data-id="${id}"]`).closest('.skin-settings');
    skinElement.remove();
}

function createSkinPack() {
    const packName = document.getElementById('pack-name').value.trim();
    const packUUID = document.getElementById('pack-uuid').value.trim();
    const moduleUUID = document.getElementById('module-uuid').value.trim();

    if (packName === '' || skinData.some(skin => skin.name === '')) {
        alert('スキンパックの名前とスキンの名前を入力してください');
        return;
    }

    const manifest = {
        format_version: 1,
        header: {
            name: packName,
            uuid: packUUID,
            version: [1, 0, 0],
        },
        modules: [
            {
                type: "skin_pack",
                uuid: moduleUUID,
                version: [1, 0, 0],
            }
        ]
    };

    //Skinjsonの中身
    const skinsJson = {
        localization_name: packName,
        serialize_name: packName.replace(/\s+/g, '_').toLowerCase(),
        geometry: "skinpacks/skins.json",
        skins: skinData.map((skin, index) => ({
            localization_name: skin.name,
            geometry: skin.armType === 'default' ? 'geometry.humanoid.custom' : 'geometry.humanoid.customSlim',
            texture: `skin_${index}.png`,
            type: "free", 
            animations: skin.animationType ? {
                "move.arms": "animation.player.move.arms.zombie"
            } : undefined,
            hide_armor: skin.hideArmor
        }))
    };

    //en_US.langを生成
    const enUsLangContent = skinData.map(skin => `skin.${packName}.${skin.name}=${skin.name}`).join('\n') +
        `\nskinpack.${packName}=${packName}`;

    const zip = new JSZip();
    zip.file("manifest.json", JSON.stringify(manifest, null, 2));
    zip.file("skins.json", JSON.stringify(skinsJson, null, 2));
    zip.folder("texts").file("en_US.lang", enUsLangContent);

    //画像を追加
    skinData.forEach((skin, index) => {
        zip.file(`skin_${index}.png`, skin.file);
    });

    zip.generateAsync({ type: "blob" }).then((content) => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(content);
        a.download = `${packName}.mcpack`;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    });
}

//協力してくれた方感謝します

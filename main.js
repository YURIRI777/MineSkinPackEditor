document.addEventListener('DOMContentLoaded', () => {
    generateUUID('pack-uuid');
    generateUUID('module-uuid');
    const fileInput = document.getElementById('skin-image');
    fileInput.addEventListener('change', handleFileSelect);
    document.addEventListener('contextmenu', function (event) {
        if (event.target.tagName !== 'INPUT' || event.target.type !== 'text') {
            event.preventDefault();
        }
    });
    document.querySelectorAll('img').forEach(img => {
        img.addEventListener('dragstart', event => event.preventDefault());
    });
});

//skinData配列
let skinData = [];

//ここでUUID生成
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
    Array.from(files).forEach(file => {
        if (!file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const skinInfo = document.createElement('div');
            skinInfo.classList.add('skin-settings');
            const newSkinData = {
                id: skinData.length,
                name: '',
                armType: 'default',
                hideArmor: false,
                armAnimation: undefined,
                legAnimation: undefined,
                otherAnimation: undefined,
                file: file,
                imgSrc: e.target.result
            };
            skinData.push(newSkinData);
            skinInfo.innerHTML = `
                <img src="${newSkinData.imgSrc}" alt="Skin Preview" class="skin-preview" style="width:64px; height:64px; margin-right:10px;">
                <input type="text" placeholder="スキン名を入力" data-id="${newSkinData.id}" class="skin-name">
                <div class="animation-row">
                    <div>
                        <label for="arm-type-${newSkinData.id}">腕のタイプ:</label>
                        <select id="arm-type-${newSkinData.id}" data-id="${newSkinData.id}" class="arm-type">
                            <option value="default">デフォルト</option>
                            <option value="slim">スリム</option>
                        </select>
                    </div>
                    <div>
                        <label for="arm-animation-${newSkinData.id}">腕アニメーション:</label>
                        <select id="arm-animation-${newSkinData.id}" data-id="${newSkinData.id}" class="arm-animation">
                            <option value="none" selected>なし</option>
                            <option value="zombie">ゾンビ化</option>
                            <option value="statue_of_liberty">右手を上げる</option>
                            <option value="stationary">腕を固定</option>
                            <option value="single">腕がシンクロ</option>
                        </select>
                    </div>
                    <div>
                        <label for="leg-animation-${newSkinData.id}">脚アニメーション:</label>
                        <select id="leg-animation-${newSkinData.id}" data-id="${newSkinData.id}" class="leg-animation">
                            <option value="none" selected>なし</option>
                            <option value="stationary">脚固定</option>
                            <option value="single">脚がシンクロ</option>
                        </select>
                    </div>
                    <div>
                        <label for="other-animation-${newSkinData.id}">その他アニメーション:</label>
                        <select id="other-animation-${newSkinData.id}" data-id="${newSkinData.id}" class="other-animation">
                            <option value="none" selected>なし</option>
                            <option value="sleeping">寝る</option>
                            <option value="riding">座る</option>
                            <option value="chaos">カオス</option>
                            <option value="pose">ポーズ</option>
                        </select>
                    </div>
                </div>
                <label>
                    <input type="checkbox" id="hide-armor-${newSkinData.id}" data-id="${newSkinData.id}" class="hide-armor"> 防具を非表示
                </label>
                <button type="button" class="delete-skin" data-id="${newSkinData.id}">🗑️</button>
            `;
            container.appendChild(skinInfo);

            //削除ボタン
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

//skinDataの更新
function updateSkinData(id, imgSrc, file) {
    const skin = skinData.find(s => s.id === id);
    skin.imgSrc = imgSrc;
    skin.file = file;
    const skinNameInput = document.querySelector(`input.skin-name[data-id="${id}"]`);
    const armTypeSelect = document.querySelector(`select.arm-type[data-id="${id}"]`);
    const armAnimationSelect = document.querySelector(`select.arm-animation[data-id="${id}"]`);
    const legAnimationSelect = document.querySelector(`select.leg-animation[data-id="${id}"]`);
    const otherAnimationSelect = document.querySelector(`select.other-animation[data-id="${id}"]`);
    const hideArmorCheckbox = document.querySelector(`input.hide-armor[data-id="${id}"]`);
    skinNameInput.addEventListener('input', () => skin.name = skinNameInput.value);
    armTypeSelect.addEventListener('change', () => skin.armType = armTypeSelect.value);
    armAnimationSelect.addEventListener('change', () => {
        const value = armAnimationSelect.value;
        skin.armAnimation = (value === 'none') ? undefined : value;
    });
    legAnimationSelect.addEventListener('change', () => {
        const value = legAnimationSelect.value;
        skin.legAnimation = (value === 'none') ? undefined : value;
    });
    otherAnimationSelect.addEventListener('change', () => {
        const value = otherAnimationSelect.value;
        if (value === 'none') {
            skin.otherAnimation = undefined;
        } else if (value === 'sleeping') {
            skin.otherAnimation = { "humanoid_base_pose": "animation.player.sleeping" };
        } else if (value === 'riding') {
            skin.otherAnimation = { "humanoid_base_pose": "animation.player.riding.legs" };
        } else if (value === 'chaos') {
            skin.otherAnimation = { "humanoid_base_pose": "animation.shulker_bullet.move" };
        } else if (value === 'pose') {
            skin.otherAnimation = { "humanoid_base_pose": "animation.armor_stand.brandish_pose" };
        }
    });
    hideArmorCheckbox.addEventListener('change', () => skin.hideArmor = hideArmorCheckbox.checked);
}

//スキン削除
function deleteSkin(id) {
    skinData = skinData.filter(skin => skin.id !== id);
    const skinElement = document.querySelector(`.skin-settings input[data-id="${id}"]`).closest('.skin-settings');
    skinElement.remove();
}

//スキンパック作成
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
        header: { name: packName, uuid: packUUID, version: [1, 0, 0] },
        modules: [{ type: "skin_pack", uuid: moduleUUID, version: [1, 0, 0] }]
    };
    const skinsJson = {
        localization_name: packName,
        serialize_name: packName.replace(/\s+/g, '_').toLowerCase(),
        geometry: "skinpacks/skins.json",
        skins: skinData.map((skin, index) => {
            let animations = {};
            if (skin.armAnimation) animations["move.arms"] = `animation.player.move.arms.${skin.armAnimation}`;
            if (skin.legAnimation) animations["move.legs"] = `animation.player.move.legs.${skin.legAnimation}`;
            if (skin.otherAnimation) Object.assign(animations, skin.otherAnimation);
            return {
                localization_name: skin.name,
                geometry: skin.armType === 'default' ? 'geometry.humanoid.custom' : 'geometry.humanoid.customSlim',
                texture: `skin_${index}.png`,
                type: "free",
                animations: Object.keys(animations).length ? animations : undefined,
                hide_armor: skin.hideArmor
            };
        })
    };
    const enUsLangContent = skinData.map(skin => `skin.${packName}.${skin.name}=${skin.name}`).join('\n') +
        `\nskinpack.${packName}=${packName}`;
    const zip = new JSZip();
    zip.file("manifest.json", JSON.stringify(manifest, null, 2));
    zip.file("skins.json", JSON.stringify(skinsJson, null, 2));
    zip.folder("texts").file("en_US.lang", enUsLangContent);
    skinData.forEach((skin, index) => zip.file(`skin_${index}.png`, skin.file));
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

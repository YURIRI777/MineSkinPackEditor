const i18n = {
    ja: {
        description: `
            <strong>MineSkinPackEditor</strong> は、簡単にスキンパックを作成できます。
            <br>これはマインクラフト統合版でのみ動作します。
            <br>利用する際は利用規約を確認してね。質問や不具合などはDiscordまで
            <br>※アップロードしたスキン画像はサーバーに送信されず、ブラウザ内でのみ処理されます。
        `,
        packNameLabel: "スキンパックの名前:",
        packNamePlaceholder: "スキンパックの名前を入力",
        regen: "再生成",
        selectSkin: "スキン画像を選択",
        create: "スキンパックを作成",

        drag: "並び替え",
        skinNamePlaceholder: "スキン名を入力",

        armType: "腕のタイプ:",
        armDefault: "デフォルト",
        armSlim: "スリム",

        armAnim: "腕アニメーション:",
        legAnim: "脚アニメーション:",
        other: "その他:",

        none: "なし",
        zombie: "ゾンビ化",
        statue: "右手を上げる",
        stationary: "固定",
        single: "シンクロ",

        sleeping: "寝る",
        riding: "座る",
        chaos: "カオス",
        pose: "ポーズ",

        hideArmor: "防具を非表示",
        deleteConfirm: "このスキンを削除しますか？",

        alertFillNames: "スキンパック名とスキン名を入力してください",
        deleteConfirm: "このスキンを削除しますか？"
    },

    en: {
        description: `
            <strong>MineSkinPackEditor</strong> allows you to easily create skin packs.
            <br>This only works on Minecraft Bedrock Edition.
            <br>Please check the terms of use before using. For questions or issues, contact us on Discord.
            <br>※Uploaded skin images are not sent to the server and are processed only within the browser.
        `,
        packNameLabel: "Skin pack name:",
        packNamePlaceholder: "Enter skin pack name",
        regen: "Regenerate",
        selectSkin: "Select skin images",
        create: "Create Skin Pack",

        drag: "Reorder",
        skinNamePlaceholder: "Enter skin name",

        armType: "Arm type:",
        armDefault: "Default",
        armSlim: "Slim",

        armAnim: "Arm animation:",
        legAnim: "Leg animation:",
        other: "Other:",

        none: "None",
        zombie: "Zombie",
        statue: "Raise right arm",
        stationary: "Stationary",
        single: "Sync",

        sleeping: "Sleeping",
        riding: "Sitting",
        chaos: "Chaos",
        pose: "Pose",

        hideArmor: "Hide armor",
        deleteConfirm: "Delete this skin?",

        alertFillNames: "Please enter the skin pack name and all skin names.",
        deleteConfirm: "Are you sure you want to delete this skin?"
    }
};

let currentLang = localStorage.getItem("lang") || "ja";

function applyLanguage(lang) {
    currentLang = lang;
    document.documentElement.lang = lang;
    localStorage.setItem("lang", lang);
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.dataset.i18n;
        if (i18n[lang]?.[key]) {
            el.textContent = i18n[lang][key];
        }
    });
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
        const key = el.dataset.i18nHtml;
        if (i18n[lang]?.[key]) {
            el.innerHTML = i18n[lang][key];
        }
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.dataset.i18nPlaceholder;
        if (i18n[lang]?.[key]) {
            el.placeholder = i18n[lang][key];
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    applyLanguage('ja');
    let skinData = [];
    let draggedElement = null;
    generateUUID('pack-uuid');
    generateUUID('module-uuid');
    const fileInput = document.getElementById('skin-image');
    const container = document.getElementById('skinPreview');
    fileInput.addEventListener('change', handleFileSelect);
    document.addEventListener('contextmenu', (e) => {
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
        }
    });
    container.addEventListener('dragstart', (e) => {
        const handle = e.target.closest('.drag-handle');
        if (!handle) return;
        draggedElement = handle.closest('.skin-settings');
        draggedElement.classList.add('dragging');
        e.dataTransfer.setData('text/plain', '');
        e.dataTransfer.effectAllowed = 'move';
    });
    container.addEventListener('dragend', () => {
        if (!draggedElement) return;
        draggedElement.classList.remove('dragging');
        draggedElement = null;
        syncSkinOrder();
    });
    container.addEventListener('dragover', (e) => {
        if (!draggedElement) return;
        e.preventDefault();
        const target = e.target.closest('.skin-settings');
        if (!target || target === draggedElement) return;
        const items = [...container.querySelectorAll('.skin-settings')];
        const firstRects = new Map();
        items.forEach(el => {
            firstRects.set(el, el.getBoundingClientRect());
        });
        const rect = target.getBoundingClientRect();
        const isAfter = (e.clientY - rect.top) > rect.height / 2;
        container.insertBefore(
            draggedElement,
            isAfter ? target.nextSibling : target
        );
        items.forEach(el => {
            const first = firstRects.get(el);
            const last = el.getBoundingClientRect();
            const dx = first.left - last.left;
            const dy = first.top - last.top;
            if (dx || dy) {
                el.style.transform = `translate(${dx}px, ${dy}px)`;
                el.style.transition = 'none';
                requestAnimationFrame(() => {
                    el.style.transform = '';
                    el.style.transition = 'transform 180ms ease';
                });
            }
        });
    });

    function syncSkinOrder() {
        const ids = [...container.querySelectorAll('.skin-settings')]
            .map(el => el.dataset.id);

        skinData = ids.map(id => skinData.find(s => s.id === id));
    }

    function generateUUID(elementId) {
        const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
        document.getElementById(elementId).value = uuid;
        window.generateUUID = generateUUID;
    }

    function handleFileSelect(event) {
        const files = event.target.files;
        Array.from(files).forEach(file => {
            if (!file.type.startsWith('image/')) return;
            const reader = new FileReader();
            reader.onload = (e) => {
                const id = crypto.randomUUID();
                const skin = {
                    id,
                    name: '',
                    armType: 'default',
                    hideArmor: false,
                    armAnimation: undefined,
                    legAnimation: undefined,
                    otherAnimation: undefined,
                    file,
                    imgSrc: e.target.result
                };
                skinData.push(skin);
                const el = document.createElement('div');
                el.className = 'skin-settings';
                el.dataset.id = id;
                el.innerHTML = `
                    <div class="drag-handle" draggable="true" title="並び替え">:::</div>
                    <img src="${skin.imgSrc}" width="64" height="64">
                    <input type="text" class="skin-name" data-i18n-placeholder="skinNamePlaceholder" placeholder="スキン名を入力">
                    <div class="animation-row">
                        <div>
                            <label data-i18n="armType">腕のタイプ:</label>
                            <select class="arm-type">
                                <option value="default" data-i18n="armDefault">デフォルト</option>
                                <option value="slim" data-i18n="armSlim">スリム</option>
                            </select>
                        </div>
                        <div>
                            <label data-i18n="armAnim">腕アニメーション:</label>
                            <select class="arm-animation">
                                <option value="none" selected data-i18n="none">なし</option>
                                <option value="zombie" data-i18n="zombie">ゾンビ化</option>
                                <option value="statue_of_liberty" data-i18n="statue">右手を上げる</option>
                                <option value="stationary" data-i18n="stationary">腕を固定</option>
                                <option value="single" data-i18n="single">腕がシンクロ</option>
                            </select>
                        </div>
                        <div>
                            <label data-i18n="legAnim">脚アニメーション:</label>
                            <select class="leg-animation">
                                <option value="none" selected data-i18n="none">なし</option>
                                <option value="stationary" data-i18n="stationary">脚固定</option>
                                <option value="single" data-i18n="single">脚がシンクロ</option>
                            </select>
                        </div>
                        <div>
                            <label data-i18n="other">その他:</label>
                            <select class="other-animation">
                                <option value="none" selected data-i18n="none">なし</option>
                                <option value="sleeping" data-i18n="sleeping">寝る</option>
                                <option value="riding" data-i18n="riding">座る</option>
                                <option value="chaos" data-i18n="chaos">カオス</option>
                                <option value="pose" data-i18n="pose">ポーズ</option>
                            </select>
                        </div>
                    </div>
                    <label>
                        <input type="checkbox" class="hide-armor">
                        <span data-i18n="hideArmor">防具を非表示</span>
                    </label>
                    <button type="button" class="delete-skin">🗑️</button>
                `;
                container.appendChild(el);
                applyLanguage(currentLang);
                bindSkinEvents(skin, el);

            };
            reader.readAsDataURL(file);
        });
    }

    function bindSkinEvents(skin, el) {
        el.querySelector('.skin-name')
            .addEventListener('input', e => skin.name = e.target.value);
        el.querySelector('.arm-type')
            .addEventListener('change', e => skin.armType = e.target.value);
        el.querySelector('.arm-animation')
            .addEventListener('change', e => {
                skin.armAnimation = e.target.value === 'none' ? undefined : e.target.value;
            });
        el.querySelector('.leg-animation')
            .addEventListener('change', e => {
                skin.legAnimation = e.target.value === 'none' ? undefined : e.target.value;
            });
        el.querySelector('.other-animation')
            .addEventListener('change', e => {
                const map = {
                    sleeping: { humanoid_base_pose: "animation.player.sleeping" },
                    riding: { humanoid_base_pose: "animation.player.riding.legs" },
                    chaos: { humanoid_base_pose: "animation.shulker_bullet.move" },
                    pose: { humanoid_base_pose: "animation.armor_stand.brandish_pose" }
                };
                skin.otherAnimation = map[e.target.value];
            });
        el.querySelector('.hide-armor')
            .addEventListener('change', e => skin.hideArmor = e.target.checked);
        el.querySelector('.delete-skin')
            .addEventListener('click', () => {
                if (!confirm(i18n[currentLang].deleteConfirm)) return;
                skinData = skinData.filter(s => s.id !== skin.id);
                el.remove();
            });
    }

    window.createSkinPack = function () {
        const packName = document.getElementById('pack-name').value.trim();
        const packUUID = document.getElementById('pack-uuid').value.trim();
        const moduleUUID = document.getElementById('module-uuid').value.trim();
        if (!packName || skinData.some(s => !s.name)) {
            alert(i18n[currentLang].alertFillNames);
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
                    geometry: skin.armType === 'default'
                        ? 'geometry.humanoid.custom'
                        : 'geometry.humanoid.customSlim',
                    texture: `skin_${index}.png`,
                    type: "free",
                    animations: Object.keys(animations).length ? animations : undefined,
                    hide_armor: skin.hideArmor
                };
            })
        };
        const lang = skinData
            .map(s => `skin.${packName}.${s.name}=${s.name}`)
            .join('\n') + `\nskinpack.${packName}=${packName}`;
        const zip = new JSZip();
        zip.file("manifest.json", JSON.stringify(manifest, null, 2));
        zip.file("skins.json", JSON.stringify(skinsJson, null, 2));
        zip.folder("texts").file("en_US.lang", lang);
        skinData.forEach((skin, index) => {
            zip.file(`skin_${index}.png`, skin.file);
        });
        zip.generateAsync({ type: "blob" }).then(content => {
            const a = document.createElement('a');
            a.href = URL.createObjectURL(content);
            a.download = `${packName}.mcpack`;
            a.click();
        });
    };

    //Pointer
    let pointerDragging = null;
    let pointerStartY = 0;
    container.addEventListener('pointerdown', (e) => {
        const handle = e.target.closest('.drag-handle');
        if (!handle) return;
        e.preventDefault();
        pointerDragging = handle.closest('.skin-settings');
        pointerStartY = e.clientY;
        pointerDragging.classList.add('dragging');
        pointerDragging.setPointerCapture(e.pointerId);
    });
    container.addEventListener('pointermove', (e) => {
        if (!pointerDragging) return;
        const target = document.elementFromPoint(e.clientX, e.clientY)
            ?.closest('.skin-settings');
        if (!target || target === pointerDragging) return;
        const items = [...container.querySelectorAll('.skin-settings')];
        const firstRects = new Map();
        items.forEach(el => {
            firstRects.set(el, el.getBoundingClientRect());
        });
        const rect = target.getBoundingClientRect();
        const isAfter = (e.clientY - rect.top) > rect.height / 2;
        container.insertBefore(
            pointerDragging,
            isAfter ? target.nextSibling : target
        );
        items.forEach(el => {
            const first = firstRects.get(el);
            const last = el.getBoundingClientRect();

            const dx = first.left - last.left;
            const dy = first.top - last.top;

            if (dx || dy) {
                el.style.transform = `translate(${dx}px, ${dy}px)`;
                el.style.transition = 'none';

                requestAnimationFrame(() => {
                    el.style.transform = '';
                    el.style.transition = 'transform 180ms ease';
                });
            }
        });
    });
    container.addEventListener('pointerup', endPointerDrag);
    container.addEventListener('pointercancel', endPointerDrag);
    function endPointerDrag() {
        if (!pointerDragging) return;
        pointerDragging.classList.remove('dragging');
        pointerDragging = null;
        syncSkinOrder();
        if (navigator.vibrate) {
            navigator.vibrate(15);
        }
    }
    const langSelect = document.getElementById('langSelect');

    if (langSelect) {
        langSelect.addEventListener('change', e => {
            applyLanguage(e.target.value);
            langSelect.classList.add('selected');
        });
    }
});

import { getContext } from "../../extensions.js";
import sqlite3 from "sqlite3";

// 初始化数据库
const db = new sqlite3.Database("./game_data.db", (err) => {
    if (err) {
        console.error("Database initialization error:", err);
    } else {
        // 确保表格存在
        db.run(`
            CREATE TABLE IF NOT EXISTS game_data (
                id INTEGER PRIMARY KEY,
                money INTEGER DEFAULT 0
            )
        `);
        // 插入初始数据
        db.get("SELECT * FROM game_data WHERE id = 1", (err, row) => {
            if (!row) {
                db.run("INSERT INTO game_data (id, money) VALUES (1, 0)");
            }
        });
    }
});

async function updateMoneyFromAiResponse(responseText) {
    // 从 AI 回复中提取金钱数值
    const moneyMatch = responseText.match(/金钱：(\d+)/);
    if (moneyMatch) {
        const money = parseInt(moneyMatch[1], 10);
        
        // 更新数据库中的金钱
        db.run("UPDATE game_data SET money = ? WHERE id = 1", money, (err) => {
            if (err) {
                console.error("Failed to update money:", err);
            } else {
                console.log("Money updated to:", money);
            }
        });
    }
}

// 获取数据库中的金钱数值
function getMoney(callback) {
    db.get("SELECT money FROM game_data WHERE id = 1", (err, row) => {
        if (err) {
            console.error("Failed to retrieve money:", err);
            callback(0);
        } else {
            callback(row ? row.money : 0);
        }
    });
}

(async function () {
    // 获取 SillyTavern 上下文
    const context = getContext();

    // 示例：显示金钱信息
    const displayElement = document.createElement('div');
    displayElement.id = 'my-extension';
    displayElement.innerHTML = `<h3>Current Money:</h3><p id="money-display">Loading...</p>`;
    document.body.appendChild(displayElement);

    // 获取当前金钱并显示
    getMoney((money) => {
        document.getElementById("money-display").innerText = `金钱: ${money}`;
    });

    // 添加按钮以手动更新金钱
    const button = document.createElement('button');
    button.innerText = "Update Money from AI";
    button.addEventListener('click', async () => {
        // 模拟从 AI 获取的回复
        const aiResponse = "当前金钱：150";  // 假设 AI 回复了这一内容
        await updateMoneyFromAiResponse(aiResponse);

        // 更新界面上的金钱
        getMoney((money) => {
            document.getElementById("money-display").innerText = `金钱: ${money}`;
        });
    });
    displayElement.appendChild(button);

    // 示例：监听 AI 回复并更新金钱
    context.onChatUpdate((newMessage) => {
        console.log("New AI Message:", newMessage);
        updateMoneyFromAiResponse(newMessage);
    });
})();

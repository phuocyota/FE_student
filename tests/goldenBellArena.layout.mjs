// Run against Vite with PLAYWRIGHT_MODULE pointing to an installed Playwright package.
// Socket and image fixtures are intercepted only in this isolated browser context.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const base = process.env.ARENA_TEST_URL || "https://127.0.0.1:5186";
const browser = await chromium.launch({
  headless: true,
  ...(process.env.ARENA_BROWSER ? { executablePath: process.env.ARENA_BROWSER } : {}),
});
const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500"><rect width="800" height="500" rx="32" fill="#ecfdf5"/><circle cx="400" cy="240" r="150" fill="#fde047"/><text x="400" y="265" font-size="70" text-anchor="middle" fill="#15803d">Rung chuông vàng</text></svg>';
const makeRoom = (count, image, answerCount, long = false) => ({
  roomId: "LAYOUT", code: "LAYOUT", status: "RUNNING", questionNo: 2,
  questionStartedAt: new Date().toISOString(), questionDurationSeconds: 30,
  students: Array.from({ length: count }, (_, index) => ({
    id: String(index), name: `Thí sinh ${index + 1}`, status: index % 3 === 0 ? "eliminated" : "active",
  })),
  currentQuestion: {
    id: "q", contentType: "TEXT", content: long ? "Câu hỏi dài cần được đọc đầy đủ, không bị cắt hoặc tràn ra khỏi vùng hiển thị. ".repeat(25) : "Quan sát hình và chọn đáp án đúng.",
    nextContentDetails: image ? [{ id: "image", contentType: "IMAGE", content: `${base}/layout-fixture.svg` }] : [],
    answers: Array.from({ length: answerCount }, (_, index) => ({
      id: `answer-${index}`, orderNo: index, contentType: "TEXT", isCorrect: index === 1,
      content: long ? "Phương án dài cần hiển thị đầy đủ và cuộn bên trong khi cần thiết. ".repeat(12) : answerCount === 2 ? ["Yes", "No"][index] : `Phương án ${index + 1}`,
    })),
  },
});

const context = await browser.newContext({ ignoreHTTPSErrors: true });
await context.route("**/src/api/socket.js*", (route) => route.fulfill({ contentType: "application/javascript", body: `
  export const createAppSocket = () => {
    const listeners = {};
    const socket = {
      connected: true,
      on(event, callback) { listeners[event] = callback; return socket; },
      off(event) { delete listeners[event]; return socket; },
      emit(event, payload, callback) { if (event === 'golden-bell:join') callback?.({ ok: true, room: window.__initialRoom }); return socket; },
      disconnect() {},
    };
    window.__updateArenaRoom = (room) => listeners['golden-bell:room-state']?.(room);
    setTimeout(() => listeners.connect?.(), 10);
    return socket;
  };
` }));
await context.route("**/layout-fixture.svg*", (route) => route.fulfill({
  contentType: "image/svg+xml",
  body: route.request().url().includes("portrait")
    ? '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="600"><rect width="240" height="600" fill="#ecfdf5"/><circle cx="120" cy="300" r="90" fill="#fde047"/></svg>'
    : svg,
}));
await context.addInitScript((room) => { window.__initialRoom = room; }, makeRoom(3, true, 2));
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
const screenshotDir = process.env.ARENA_SCREENSHOT_DIR || join(tmpdir(), "fe-student-arena-layout");
await mkdir(screenshotDir, { recursive: true });
let checked = 0;
try {
  await page.goto(`${base}/golden-bell-arena/LAYOUT`);
  await page.waitForSelector(".arena-answer");
  for (const [width, height] of [[1366, 768], [1600, 900], [1920, 1080], [1000, 800], [820, 900], [390, 844]]) {
    await page.setViewportSize({ width, height });
    for (const count of [3, 20, 100]) {
      for (const image of [false, true]) {
        for (const answerCount of [2, 3, 4]) {
          await page.evaluate((room) => window.__updateArenaRoom(room), makeRoom(count, image, answerCount));
          await page.waitForFunction((count) => document.querySelectorAll(".arena-students-grid > div").length === count, count);
          await page.evaluate(() => new Promise(requestAnimationFrame));
          const metrics = await page.evaluate(() => {
            const question = document.querySelector(".arena-question-card").getBoundingClientRect();
            const list = document.querySelector(".arena-students-grid");
            const answers = [...document.querySelectorAll(".arena-answer")].map((node) => node.getBoundingClientRect());
            const images = [...document.querySelectorAll(".arena-question-media img")].map((node) => node.getBoundingClientRect());
            return {
              horizontal: document.documentElement.scrollWidth > innerWidth,
              vertical: document.documentElement.scrollHeight > innerHeight,
              listHorizontal: list.scrollWidth > list.clientWidth + 1,
              listScroll: list.scrollHeight > list.clientHeight,
              answerContained: answers.every((rect) => rect.left >= question.left && rect.right <= question.right && rect.bottom <= question.bottom),
              answerEqual: answers.every((rect) => Math.abs(rect.height - answers[0].height) < 2),
              imagesContained: images.every((rect) => rect.width > 0 && rect.height > 0 && rect.top >= question.top && rect.bottom <= answers[0].top && rect.right <= question.right),
              avatarWidth: document.querySelector(".arena-students-grid img, .arena-students-grid span[aria-hidden]").getBoundingClientRect().width,
              questionAtTop: document.querySelector(".arena-question-text").getBoundingClientRect().top - document.querySelector(".arena-category").getBoundingClientRect().bottom,
              naturalContent: [...document.querySelectorAll(".arena-question-text, .arena-answer-content")].every((node) => node.scrollHeight <= node.clientHeight + 1 && node.scrollWidth <= node.clientWidth + 1),
              answerGap: document.querySelector(".arena-answers").getBoundingClientRect().top - document.querySelector(".arena-question-stage").getBoundingClientRect().bottom,
            };
          });
          const label = `${width}x${height}/${count} students/image=${image}/${answerCount} answers`;
          assert.equal(metrics.horizontal, false, `${label}: page horizontal overflow`);
          assert.equal(metrics.listHorizontal, false, `${label}: list horizontal overflow`);
          assert.equal(metrics.answerContained, true, `${label}: answers outside card`);
          assert.equal(metrics.imagesContained, true, `${label}: image outside stage`);
          assert.ok(metrics.avatarWidth <= 57, `${label}: stretched avatar`);
          assert.ok(metrics.questionAtTop >= 16 && metrics.questionAtTop <= 24, `${label}: question should follow category`);
          assert.ok(metrics.answerGap >= 10 && metrics.answerGap <= 24, `${label}: answers should follow question stage`);
          assert.equal(metrics.naturalContent, true, `${label}: question/answer must have no internal overflow`);
          if (width >= 900) {
            if (!image) assert.equal(metrics.vertical, false, `${label}: short question should fit viewport`);
            assert.equal(metrics.answerEqual, true, `${label}: unequal answers`);
            if (count === 100) assert.equal(metrics.listScroll, true, `${label}: list should scroll independently`);
          }
          checked++;
        }
      }
    }
    if (width >= 900) await page.screenshot({ path: join(screenshotDir, `${width}x${height}.png`) });
  }
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.evaluate((room) => window.__updateArenaRoom(room), makeRoom(100, true, 4, true));
  await page.evaluate(() => new Promise(requestAnimationFrame));
  assert.equal(await page.evaluate(() => document.documentElement.scrollHeight > innerHeight), true, "Long content can extend the page instead of hiding answers");
  assert.equal(await page.locator(".arena-question-text").evaluate((node) => node.scrollHeight > node.clientHeight + 1), false, "Long question must not have an internal scrollbar");
  assert.equal(await page.locator(".arena-answer-content").first().evaluate((node) => node.scrollHeight > node.clientHeight + 1), false, "Long answers must grow naturally without an internal scrollbar");
  await page.screenshot({ path: join(screenshotDir, "long-content.png") });
  for (const columns of [4, 8]) {
    await page.evaluate(({ room, columns }) => {
      localStorage.setItem("goldenBellSeating:LAYOUT", JSON.stringify({ columns, studentIds: ["2", "0", "1"] }));
      window.dispatchEvent(new StorageEvent("storage", { key: "goldenBellSeating:LAYOUT" }));
      window.__updateArenaRoom(room);
    }, { room: makeRoom(20, true, 2), columns });
    await page.evaluate(() => new Promise(requestAnimationFrame));
    assert.match(await page.locator(".arena-students-grid > div").first().getAttribute("aria-label"), /Thí sinh 3/, "Saved order survives layout changes");
    assert.equal(await page.locator(".arena-students-grid").evaluate((node) => node.scrollWidth > node.clientWidth + 1), false, `${columns} saved columns must not create horizontal scroll`);
  }
  const imageAnswerRoom = makeRoom(20, true, 4);
  imageAnswerRoom.currentQuestion.answers[0].nextContentDetails = [{ id: "answer-image", contentType: "IMAGE", content: `${base}/layout-fixture.svg` }];
  imageAnswerRoom.questionEndedAt = new Date().toISOString();
  await page.evaluate((room) => window.__updateArenaRoom(room), imageAnswerRoom);
  await page.waitForFunction(() => document.querySelector(".arena-answer-media img")?.complete);
  await page.waitForFunction(() => document.querySelector(".arena-answers")?.textContent.includes("Đáp án đúng"));
  assert.equal(await page.locator(".arena-answer-media img").evaluate((node) => {
    const image = node.getBoundingClientRect();
    const card = node.closest(".arena-answer").getBoundingClientRect();
    return image.width <= card.width && node.parentElement.scrollWidth <= node.parentElement.clientWidth;
  }), true, "Image answers remain inside their card");
  assert.ok(await page.locator(".arena-answer-media img").evaluate((node) => {
    const height = node.getBoundingClientRect().height;
    return height >= 140 && height <= 180;
  }), "Answer image should be enlarged within responsive bounds");
  await page.screenshot({ path: join(screenshotDir, "image-answer.png"), fullPage: true });
  for (const width of [1366, 900, 820, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    for (const answerCount of [2, 3, 4]) {
      for (const kind of ["text", "mixed", "image", "long"]) {
        const room = makeRoom(3, false, answerCount);
        room.currentQuestion.answers = room.currentQuestion.answers.map((answer, index) => ({
          ...answer,
          content: kind === "image" ? "" : kind === "long" ? "Nội dung đáp án dài vẫn phải xuống dòng tự nhiên và đọc được đầy đủ. ".repeat(8) : answer.content,
          nextContentDetails: kind !== "text" ? [{ id: `${answer.id}-image`, contentType: "IMAGE", content: `${base}/layout-fixture.svg${index % 2 ? "?portrait" : ""}` }] : [],
        }));
        await page.evaluate((room) => window.__updateArenaRoom(room), room);
        await page.evaluate(() => new Promise(requestAnimationFrame));
        const layout = await page.evaluate(() => {
          const cards = [...document.querySelectorAll(".arena-answer")];
          return {
            noOverflow: cards.every((node) => node.scrollWidth <= node.clientWidth + 1 && node.scrollHeight <= node.clientHeight + 1),
            headingsInline: cards.every((node) => {
              const label = node.querySelector(".arena-answer-letter").getBoundingClientRect();
              const text = node.querySelector(".arena-answer-content").getBoundingClientRect();
              return Math.abs(label.top - text.top) < 2 && text.left > label.right;
            }),
            imagesBelow: cards.every((node) => {
              const media = node.querySelector(".arena-answer-media");
              if (!media) return true;
              const image = media.getBoundingClientRect();
              const heading = node.querySelector(".arena-answer-heading").getBoundingClientRect();
              return image.top >= heading.bottom + 10 && image.width <= 240 && image.height >= 140 && image.height <= 180 && [...media.querySelectorAll("img")].every((img) => getComputedStyle(img).objectFit === "contain");
            }),
            columns: getComputedStyle(document.querySelector(".arena-answers")).gridTemplateColumns.split(" ").length,
          };
        });
        assert.equal(layout.noOverflow, true, `${width}/${answerCount}/${kind}: no answer scrollbars`);
        if (kind !== "image") assert.equal(layout.headingsInline, true, `${width}/${answerCount}/${kind}: label and text on same line`);
        assert.equal(layout.imagesBelow, true, `${width}/${answerCount}/${kind}: compact image below heading`);
        assert.equal(layout.columns, width >= 900 ? 2 : 1, `${width}: responsive column count`);
        checked++;
      }
    }
  }
  const waitingRoom = { ...makeRoom(3, false, 2), currentQuestion: null };
  await page.evaluate((room) => window.__updateArenaRoom(room), waitingRoom);
  await page.waitForSelector(".arena-question-card .arena-empty");
  assert.equal(await page.evaluate(() => document.documentElement.scrollHeight > innerHeight), false, "Waiting screen remains within viewport");
  assert.deepEqual(errors, [], "No runtime errors");
  console.log(`Passed ${checked} layout scenarios plus long content, saved seating, image answers, correct-answer reveal and waiting-screen checks; screenshots in ${screenshotDir}.`);
} finally {
  await browser.close();
}

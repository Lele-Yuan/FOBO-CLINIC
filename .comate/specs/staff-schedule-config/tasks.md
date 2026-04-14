# 人员管理 + 排班模板配置 + 排班页重构 任务清单

- [ ] Task 1: 创建工具模块 utils/scheduleData.js（数据读写 + 默认值）
    - 1.1: 定义 DEFAULT_STAFF 默认人员列表（与当前 STAFF_LIST 等效）
    - 1.2: 定义 DEFAULT_CONFIG 默认排班参数（R_day=4, T_week=1.5 等）
    - 1.3: 实现 getStaffList() —— 读取 schedule_staff_list，首次返回默认值并写入 Storage
    - 1.4: 实现 saveStaffList(list) —— 写入 schedule_staff_list
    - 1.5: 实现 getScheduleConfig() —— 读取 schedule_config，首次返回默认值并写入 Storage
    - 1.6: 实现 saveScheduleConfig(cfg) —— 写入 schedule_config
    - 1.7: module.exports 导出所有方法和默认常量

- [ ] Task 2: 新建人员管理页（pages/staff/）
    - 2.1: 创建 staff.json（注册 page-header 组件，设置导航栏标题"人员管理"）
    - 2.2: 创建 staff.js —— onLoad 从 scheduleData.getStaffList() 加载数据；实现 openAdd（弹出新增弹窗）；实现 openEdit(e)（弹出编辑弹窗，回填数据）；实现 confirmSave（校验后 saveStaffList，关闭弹窗）；实现 confirmDelete（弹窗确认后删除，saveStaffList）；倒班人员新增时 rotateOffset 自动赋值为当前倒班人数 % 3
    - 2.3: 创建 staff.wxml —— page-header；人员列表（颜色点+姓名+类型标签+编辑/删除按钮）；底部"+ 添加人员"按钮；编辑/新增弹窗（姓名 input、类型 radio、颜色色板 8 种预设色、rotateOffset 仅 rotate 类型显示）
    - 2.4: 创建 staff.wxss —— 与 schedule 页统一风格（白底卡片、圆角15px、米白背景），人员行布局，颜色色板 grid，弹窗 modal 样式

- [ ] Task 3: 新建排班模板配置页（pages/schedule-config/）
    - 3.1: 创建 schedule-config.json（注册 page-header，导航栏标题"排班配置"）
    - 3.2: 创建 schedule-config.js —— onLoad 从 getScheduleConfig() 加载；实现步进器 stepChange(e)（字段名+步长，最小值约束）；实现 toggleDay(e) 切换强制全员日/轮休日；实现 save（校验后 saveScheduleConfig，showToast 后 navigateBack）；实现 reset（写入 DEFAULT_CONFIG，刷新页面数据）
    - 3.3: 创建 schedule-config.wxml —— page-header；三张配置卡片（每日需求 / 休息配额 / 工作日约束）；步进器组件 inline（label + [-] [数值] [+]）；工作日 chip 多选（一二三四五六日）；底部保存按钮 + 恢复默认按钮
    - 3.4: 创建 schedule-config.wxss —— 配置卡片行样式，步进器布局，chip 选中/未选中状态，按钮样式

- [ ] Task 4: 重构排班页 schedule.js（算法动态化）
    - 4.1: 文件顶部移除所有硬编码常量（STAFF_LIST、STANDBY_POOL、ROTATE_CYCLE 等），改为在 buildGlobalSchedule 内动态读取
    - 4.2: 重构 pass1Base(schedule, dates, staffList) —— 接收 staffList 参数，动态筛选 rotate 人员和非 rotate 人员
    - 4.3: 重构 pass2Standby(schedule, dates, staffList, config) —— 动态生成 STANDBY_POOL（排除 head/pregnant）；排除条件改为 ['主','下','休']（去掉 '上'，允许上午休者备班）
    - 4.4: 新增 pass3NightAfterRest(schedule, dates, staffList, config) —— 对所有 '夜'（下夜班），根据 config.T_after_night 将次日设为 '下'（全天休）；仅处理非 manual 格子
    - 4.5: 重构 pass4WeeklyRest(schedule, dates, staffList, config) —— 阈值改为 config.T_week；_calcRestScore 中移除 '上' 的0.5计分（备班后休不计入配额）；轮休日从 config.restRotationDays 读取；最少上班人数用 config.minOnDuty；将白班专属角色列表改为动态 ['head','pregnant','day'] + 实际存在的 type
    - 4.6: 重构 buildGlobalSchedule() —— 调用 getStaffList()/getScheduleConfig() 获取动态数据；pass 调用顺序：pass1 → pass3 → pass2 → pass4
    - 4.7: 重构 buildWeekViewData(weekStart, staffList) —— 接收 staffList 替代全局 STAFF_LIST；更新 Page.data.staffList 为动态值
    - 4.8: 在 Page.onShow 中调用 buildGlobalSchedule() 重建（保证从人员/配置页返回时数据刷新）
    - 4.9: 新增 goStaff() / goConfig() 导航方法

- [ ] Task 5: 修改 schedule.wxml 和 schedule.wxss（增加管理入口）
    - 5.1: schedule.wxml —— 在 week-nav 内部（日期标签右侧或导航按钮外层）增加两个图标按钮（人员管理、排班配置），使用文字图标（👥/⚙）或 Unicode 字符；排班规则说明卡片中的硬编码文字改为 config 动态数据展示
    - 5.2: schedule.wxss —— 新增 .nav-actions、.nav-icon-btn 等样式，确保图标按钮不影响原有 week-nav 布局

- [ ] Task 6: 更新 app.json 注册新页面，并在首页 home 增加入口卡片
    - 6.1: app.json pages 数组增加 "pages/staff/staff" 和 "pages/schedule-config/schedule-config"
    - 6.2: home.js cardList 增加两张卡片（人员管理、排班配置），分配合适的背景色和图标


const scheduleData = require('../../utils/scheduleData')

const TYPE_OPTIONS = [
  { value: 'rotate',   label: '倒班人员', desc: '可上白班/夜班/备班' },
  { value: 'head',     label: '护士长',   desc: '仅白班，不参与夜班和备班' },
  { value: 'pregnant', label: '备孕人员', desc: '仅白班，不参与夜班和备班' },
  { value: 'day',      label: '白班专属', desc: '仅白班，可参与备班' },
]

const EMPTY_FORM = {
  id: '',
  name: '',
  type: 'rotate',
  color: scheduleData.PRESET_COLORS[0],
  rotateOffset: 0,
}

Page({
  data: {
    staffList: [],
    typeOptions: TYPE_OPTIONS,
    presetColors: scheduleData.PRESET_COLORS,
    typeLabels: scheduleData.TYPE_LABELS,

    showModal: false,
    isEdit: false,
    form: Object.assign({}, EMPTY_FORM),

    showDeleteConfirm: false,
    deleteTargetId: '',
    deleteTargetName: '',
  },

  onLoad() {
    this._loadList()
  },

  onShow() {
    wx.setNavigationBarColor({ frontColor: '#000000', backgroundColor: '#FAF8F5' })
  },

  _loadList() {
    const list = scheduleData.getStaffList()
    // 附加 typeLabel 用于显示
    const display = list.map(s => Object.assign({}, s, {
      typeLabel: scheduleData.TYPE_LABELS[s.type] || s.type
    }))
    this.setData({ staffList: display })
  },

  // ─── 打开新增弹窗 ───
  openAdd() {
    const rotateCount = this.data.staffList.filter(s => s.type === 'rotate').length
    const form = Object.assign({}, EMPTY_FORM, {
      rotateOffset: rotateCount,
      color: scheduleData.PRESET_COLORS[this.data.staffList.length % scheduleData.PRESET_COLORS.length],
    })
    this.setData({ showModal: true, isEdit: false, form })
  },

  // ─── 打开编辑弹窗 ───
  openEdit(e) {
    const id = e.currentTarget.dataset.id
    const person = this.data.staffList.find(s => s.id === id)
    if (!person) return
    this.setData({
      showModal: true,
      isEdit: true,
      form: Object.assign({}, person),
    })
  },

  // ─── 表单字段更新 ───
  onNameInput(e) {
    this.setData({ 'form.name': e.detail.value })
  },

  onTypeChange(e) {
    const type = e.currentTarget.dataset.type
    const rotateCount = this.data.staffList.filter(s => s.id !== this.data.form.id && s.type === 'rotate').length
    this.setData({
      'form.type': type,
      'form.rotateOffset': type === 'rotate' ? rotateCount : 0,
    })
  },

  onColorChange(e) {
    this.setData({ 'form.color': e.currentTarget.dataset.color })
  },

  // ─── 确认保存 ───
  confirmSave() {
    const { form, staffList, isEdit } = this.data
    if (!form.name.trim()) {
      wx.showToast({ title: '请输入姓名', icon: 'none' })
      return
    }

    let newList = [...staffList]

    if (isEdit) {
      const idx = newList.findIndex(s => s.id === form.id)
      if (idx >= 0) newList[idx] = Object.assign({}, form)
    } else {
      const id = 'staff_' + Date.now()
      newList.push(Object.assign({}, form, { id }))
    }

    // 去掉 typeLabel 再保存
    const toSave = newList.map(({ typeLabel, ...rest }) => rest)
    scheduleData.saveStaffList(toSave)
    this._loadList()
    this.setData({ showModal: false })
    wx.showToast({ title: isEdit ? '已更新' : '已添加', icon: 'success' })
  },

  closeModal() {
    this.setData({ showModal: false })
  },

  // 阻止弹窗内点击事件冒泡到遮罩层
  noop() {},

  // ─── 删除确认 ───
  openDelete(e) {
    const id = e.currentTarget.dataset.id
    const person = this.data.staffList.find(s => s.id === id)
    if (!person) return
    this.setData({
      showDeleteConfirm: true,
      deleteTargetId: id,
      deleteTargetName: person.name,
    })
  },

  confirmDelete() {
    const { deleteTargetId, staffList } = this.data
    const newList = staffList.filter(s => s.id !== deleteTargetId)
    const toSave = newList.map(({ typeLabel, ...rest }) => rest)
    scheduleData.saveStaffList(toSave)
    this._loadList()
    this.setData({ showDeleteConfirm: false, deleteTargetId: '', deleteTargetName: '' })
    wx.showToast({ title: '已删除', icon: 'success' })
  },

  cancelDelete() {
    this.setData({ showDeleteConfirm: false })
  },
})

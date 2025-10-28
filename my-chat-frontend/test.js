/* 20250227
Date:20250227
Author:Peter
Description:
当用户选择了一级分类时，根据选择的一级分类，更新二级分类的选项。
当用户选择了二级分类时，根据选择的一级和二级分类，更新三级分类的选项。

*/
const categoryMapping = {
  "单功能芯片": {
    "检波器": ["对数检波器", "包络检波器", "多用途检波器", "检波对数视频放大器", "RMS检波器", "检波模组"],
    "射频开关": ["直流射频开关", "微功耗二极管", "高隔离射频开关", "高功率射频开关", "高线性射频开关", "通用射频开关", "超宽带射频开关", "PIN二极管射频开关"],
    "限幅器": ["单片限幅器", "PIN二极管限幅器"],
    "滤波器": ["固定滤波器", "可调滤波器"],
    "衰减器": ["数控衰减器", "压控衰减器", "固定衰减器"],
    "移相器": ["数控移相器", "压控移相器"],
    "放大器": ["通用放大器", "低噪声放大器", "射频前端", "限幅放大器", "可变增益放大器", "双向放大器", "功率放大器", "功率晶体管"],
    "电源管理芯片": ["电源转换芯片"],
    "二极管": ["大功率PIN二极管"],
    "延时线": ["固定延时线", "可调延时线"]
  },
  "波束赋形芯片": {
    "波束赋形收发芯片": ["雷达波束赋形收发芯片", "卫通波束赋形收发芯片", "5G毫米波波束赋形收发芯片", "通用波束赋形收发芯片"],
    "波束赋形幅相控制芯片": ["雷达波束赋形幅相控制芯片", "卫通波束赋形幅相控制芯片", "通用波束赋形幅相控制芯片"]
  },
  "射频收发机芯片": {
    "全集成射频收发机芯片": ["毫米波雷达收发机芯片", "毫米波通信收发机芯片"],
    "上下变频芯片": ["雷达上下变频器", "卫通上下变频器", "通用上下变频器"],
    "模数/数模转换器": ["模数转换器", "数模转换器", "模拟前端芯片"],
    "频率综合器": ["压控振荡器", "锁相环", "集成VCO的锁相环", "分频器", "倍频器"]
  }
};


// 获取下拉框元素
const type1Select = document.getElementById('Text02'); 
const type2Select = document.getElementById('Text03'); 
const type3Select = document.getElementById('Text04'); 
// 初始化一级分类选项
updateOptions(type1Select, Object.keys(categoryMapping));
// 初始化二级分类选项
updateOptions(type2Select, Object.keys(categoryMapping[type1Select.value] || {}));
// 初始化三级分类选项
updateOptions(type3Select, categoryMapping[type1Select.value]?.[type2Select.value] || []);
// 监听一级分类选择事件
type1Select.addEventListener('change',  function () {
    const selectedType1 = this.value;

    // 根据一级分类更新二级分类选项
    updateOptions(type2Select, Object.keys(categoryMapping[selectedType1]  || {}));
    // 清空三级分类选项
    updateOptions(type3Select, []);
});

// 监听二级分类选择事件
type2Select.addEventListener('change',  function () {
    const selectedType1 = type1Select.value; 
    const selectedType2 = this.value; 
    // 根据一级和二级分类更新三级分类选项
    updateOptions(type3Select, categoryMapping[selectedType1]?.[selectedType2] || []);
});

// 更新下拉框选项的函数
function updateOptions(selectElement, options) {
    //保留默认被选中的值
    const selectedValue = selectElement.value;
    // 清空原选项（除第一个空选项）
    while (selectElement.options.length  > 1) {
        selectElement.remove(1); 
    }
    // 添加新选项
    options.forEach(option  => {
        const newOption = document.createElement('option'); 
        newOption.value  = option;
        newOption.textContent  = option;
        // 恢复被选中的值
        if (selectedValue === option) {
            newOption.selected = true;
        }
        selectElement.add(newOption); 
    });
}
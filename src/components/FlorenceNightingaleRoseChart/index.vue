<template>
    <div>
        <el-card>
            <div slot="header" style="font-size: 20px;font-weight: bold;">
                {{ name }}
            </div>
            <!-- 查询参数插槽 -->
            <div style="margin-bottom: 20px; min-height: 80px; display: flex; align-items: flex-start; justify-content: space-between;">
                <div style="flex: 1;">
                    <slot name="queryParams">
                        <!-- 默认空内容，外部可以通过插槽自定义查询表单 -->
                    </slot>
                </div>
                <div style="margin-left: 10px; padding-top: 2px;" v-if="$slots.queryParams">
                    <el-button type="primary" icon="el-icon-search" size="small" @click="handleSearch">搜索</el-button>
                </div>
            </div>
            <!-- 使用动态生成的 ID -->
            <div :style="{ width: '100%', height: '400px' }" :id="chartId" v-if="dataList.length > 0"></div>
            <el-empty :style="{ width: '100%', height: '400px' }" description="数据为空~" v-else></el-empty>
        </el-card>
    </div>
</template>

<script>
import * as echarts from 'echarts';

export default {
    props: {
        name: {
            type: String,
            default: '基础南丁格尔玫瑰图'
        },
        dataList: {
            type: Array,
            default: () => []
        }
    },
    data() {
        return {
            // 动态生成唯一的图表 ID
            chartId: `chart-${Date.now()}-${Math.floor(Math.random() * 1000)}florenceNightingaleRoseChart`
        }
    },
    watch: {
        dataList: {
            handler(newVal, oldVal) {
                this.$nextTick(() => {
                    if (newVal.length === 0) {
                        return;
                    }
                    this.initChart(newVal);
                })
            },
            deep: true,
            immediate: true
        }
    },
    methods: {
        handleSearch() {
            // 触发搜索事件，将查询参数传递给父组件
            this.$emit('search', this.getQueryParams());
        },
        getQueryParams() {
            // 获取查询参数，子组件可以通过 ref 调用此方法
            // 如果插槽中有表单，可以通过 $refs 获取表单数据
            // 这里返回一个空对象，实际使用时可以在插槽中通过 ref 获取表单数据
            return {};
        },
        initChart(data) {
            // 使用动态生成的 ID 获取 DOM 元素
            var chartDom = document.getElementById(this.chartId);
            var myChart = echarts.init(chartDom);
            var option;
            option = {
                legend: {
                    top: 'bottom'
                },
                toolbox: {
                    show: true,
                    feature: {
                        mark: { show: true },
                        dataView: { show: true, readOnly: false },
                        restore: { show: true },
                        saveAsImage: { show: true }
                    }
                },
                series: [
                    {
                        name: this.name,
                        type: 'pie',
                        radius: [25, 125],
                        center: ['50%', '50%'],
                        roseType: 'area',
                        itemStyle: {
                            borderRadius: 8
                        },
                        data: data
                    }
                ]
            };
            option && myChart.setOption(option);
        }
    }
}
</script>
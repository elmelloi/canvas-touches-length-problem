## 复现
1. 执行 pnpm i
2. 执行 pnpm run dev:weapp
3. 把该项目添加到微信开发者工具
4. 在微信开发者工具，点击真机调试
5. 进入小程序后，点击“选择图片”，添加任意图片
6. 先对图片进行单指拖动，打印touches数组长度为1
7. 再对图片进行双指放缩，打印touches数组长度为2
8. 再对图片进行单指拖动，会发现图片不是拖动而是放缩，打印touches数组长度为2
9. 此时你再进行双指操作时，一个手指动，一个手指不动，操作后再进行单指操作会发现打印touches数组长度为1


## 参考

重现情况是先双指滑动，然后再单指滑动，此时单指的e.touches里面返回了两个数据，这个跟html里面的canvas变现不一致

https://segmentfault.com/a/1190000042436235  用这里面的例子进行真机调试就不会出现上述情况

https://developers.weixin.qq.com/community/develop/doc/0008a6353b0af000e60a4e8045d000

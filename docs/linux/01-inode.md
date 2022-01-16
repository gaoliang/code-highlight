---
date: 2021-09-18
---
# 理解 inode & 软硬链接

## 什么是 inode

inode 是 类 unix 文件系统中，用于描述一个文件系统对象（例如文件、目录）的数据结构。 
其中包含了与该文件系统对象有关的一些信息, 比如文件的创建者、文件的创建日期、文件的大小、文件所处的 block 等。
文件系统中的每一个文件都会有对应的 inode 及 inode 编号。

## inode 的结构

- 文件字节数
- 文件的拥有者
- 文件的所属组
- 文件的读、写、执行权限
- ctime: 创建时间、mtime: 上次变动时间、atime: 上次打开时间
- 文件位置
- 链接数，即有多少个文件名指向这个 inode

## 查看 inode

可以使用 `stat` 命令查看inode信息

```shell
ubuntu@VM-8-4-ubuntu:~/mc-server$ stat docker-compose.yml
  File: docker-compose.yml
  Size: 371       	Blocks: 8          IO Block: 4096   regular file
Device: fc02h/64514d	Inode: 271837      Links: 1
Access: (0664/-rw-rw-r--)  Uid: ( 1000/  ubuntu)   Gid: ( 1000/  ubuntu)
Access: 2021-09-02 18:00:11.985645651 +0800
Modify: 2021-08-27 22:15:25.076072895 +0800
Change: 2021-08-27 22:15:25.080073017 +0800
 Birth: -
```
这其中除了文件名以外的所有信息，都是存储在 inode 中的。

:::info stat 返回值的含义
```
File - The name of the file.
Size - The size of the file in bytes.
Blocks - The number of allocated blocks the file takes.
IO Block - The size in bytes of every block.
File type - (ex. regular file, directory, symbolic link.)
Device - Device number in hex and decimal.
Inode - Inode number.
Links - Number of hard links.
Access - File permissions in the numeric and symbolic methods.
Uid - User ID and name of the owner .
Gid - Group ID and name of the owner.
Context - The SELinux security context.
Access - The last time the file was accessed.
Modify - The last time the file’s content was modified.
Change - The last time the file’s attribute or content was changed.
Birth - File creation time (not supported in Linux).
```
:::

## inode 会占用存储空间
inode 中会存储数据，因此也会占用磁盘空间。 对于每个磁盘分区， Linux 都会将其分为数据库区 和 inode 区（inode table）。

我们可以使用 df 命令查看 inode 使用情况

```shell
Filesystem      Inodes  IUsed   IFree IUse% Mounted on
udev            492034    425  491609    1% /dev
tmpfs           503824   1040  502784    1% /run
/dev/vda2      5201920 833319 4368601   17% /
tmpfs           503824      7  503817    1% /dev/shm
tmpfs           503824      4  503820    1% /run/lock
tmpfs           503824     18  503806    1% /sys/fs/cgroup
```

由于每个文件都必须有一个inode，因此有可能发生inode已经用光，但是硬盘还未存满的情况。这时，就无法在硬盘上创建新文件。

## inode 编号

每一个 inode 都有一个编号，操作系统使用这个编号来识别不同的文件。 

因此，对于操作系统来说，识别文件和目录使用的是 inode 编号，而文件名和目录名只是 inode 的便于识别的别名。

当我们通过文件名打开一个文件时，实际上操作系统将这个过程分为了三个步骤

1. 找出文件名对应的 inode 编号
2. 根据 inode 编号，获取 inode 的信息
3. 根据 inode 信息，找到文件数据所在的 block，读取数据

可以使用 `ls -i` 命令，查看文件名 对应的 inode 编号

```shell
ubuntu@VM-8-4-ubuntu:~/mc-server$ ls -i docker-compose.yml
271837 docker-compose.yml
```

## 目录也是文件

Linux系统中，一切皆文件，包括目录、硬链接、软链接、socket、设备、内存等。理解这一点非常重要。

目录文件的结构非常简单，就是一系列目录项（dirent）的列表。每个目录项，由两部分组成：所包含文件的文件名，以及该文件名对应的inode号码。

也就是说目录文件保存的是一张文件名和inode号码对应关系表。

可以使用 `ls -i /dir` 查看目录下的文件名和 inode 号

```shell
ubuntu@VM-8-4-ubuntu:~/mc-server$ ls -i .
271837 docker-compose.yml  271763 minecraft-data
```

## 硬链接
Linux Unix 中，允许多个文件名，指向相同的 inode。 

这样的设计，可以实现使用不同的文件名，访问相同的文件。如果对文件做了修改，会影响到所有相关的文件名；但是删除一个文件名时，并不会影响到其他文件名的访问，这种情况下，就称为硬链接（hard link）

我们可以使用 `ln` 命令创建一个硬链接

```shell
ubuntu@VM-8-4-ubuntu:~/test-dir$ ls
a  b
ubuntu@VM-8-4-ubuntu:~/test-dir$ ln a c
ubuntu@VM-8-4-ubuntu:~/test-dir$ ls -i
271776 a  277497 b  271776 c
ubuntu@VM-8-4-ubuntu:~/test-dir$
```

运行上面这条命令以后，源文件与目标文件的inode号码相同，都指向同一个inode。inode信息中有一项叫做"链接数"，记录指向该inode的文件名总数，这时就会增加1。

反过来，删除一个文件名，就会使得inode节点中的"链接数"减1。当这个值减到0，表明没有文件名指向这个inode，系统就会回收这个inode号码，以及其所对应block区域。

这里顺便说一下目录文件的"链接数"。创建目录时，默认会生成两个目录项："."和".."。前者的inode号码就是当前目录的inode号码，等同于当前目录的"硬链接"；后者的inode号码就是当前目录的父目录的inode号码，等同于父目录的"硬链接"。所以，任何一个目录的"硬链接"总数，总是等于2加上它的子目录总数（含隐藏目录）。

## 软链接

软链接，又称为符号链接，是一种特殊的文件，其中记录了其链接到的目标文件的路径。读取软连接文件时，系统会自动重定向到其连接的文件。

因此软链接文件的 inode 编号和其链接的源文件的 inode 编号是不同的。 软链接文件也是依赖于目标文件而存在的，当目标文件丢失时，打开软链接文件就会报错。 

总结而言，我们可以说硬链接文件是指向了源文件的 inode 编号，软链接文件是指向了源文件的文件名。 

```shell
ubuntu@VM-8-4-ubuntu:~/test-dir$ ls -ail
total 8
271413 drwxrwxrwx  2 ubuntu ubuntu 4096 Sep 17 23:44 .
148097 drwx------ 13 ubuntu ubuntu 4096 Sep 17 23:10 ..
271776 -rw-rw-r--  2 ubuntu ubuntu    0 Sep 17 23:10 a
277497 -rw-rw-r--  1 ubuntu ubuntu    0 Sep 17 23:10 b
271776 -rw-rw-r--  2 ubuntu ubuntu    0 Sep 17 23:10 c
277522 lrwxrwxrwx  1 ubuntu ubuntu    1 Sep 17 23:44 d -> b
ubuntu@VM-8-4-ubuntu:~/test-dir$ rm b
ubuntu@VM-8-4-ubuntu:~/test-dir$ cat d
cat: d: No such file or directory
ubuntu@VM-8-4-ubuntu:~/test-dir$ ls -ail
total 8
271413 drwxrwxrwx  2 ubuntu ubuntu 4096 Sep 17 23:46 .
148097 drwx------ 13 ubuntu ubuntu 4096 Sep 17 23:10 ..
271776 -rw-rw-r--  2 ubuntu ubuntu    0 Sep 17 23:10 a
271776 -rw-rw-r--  2 ubuntu ubuntu    0 Sep 17 23:10 c
277522 lrwxrwxrwx  1 ubuntu ubuntu    1 Sep 17 23:44 d -> b
```

## inode 的特殊作用

inode 相当于在实际的文件和文件名之间，加了一层中间层，因此也可以产生一些特殊的作用。

1. 文件名包含特殊字符导致无法删除，可以直接删除 inode 信息
2. 移动或重命名文件时，只需要改变文件名，而不影响 inode 信息，因此会很快。 
3. 打开一个文件后，系统就从 inode 号码来识别这个文件，不再考虑文件名了。 因此，通常来说，系统无法通过 inode 号反向查询文件名。 

第 3 点的一个应用场景便是实现应用的平滑升级，我们可以在不关闭软件的情况下，去更新软件，而无需重启。 因为系统是通过 inode 去识别文件的， 运行中的文件并不关心文件名信息。 我们在更新时，新版文件可以和老文件使用相同的文件名，但 inode 编号不同。 这样，并不会影响到运行中的文件，等到下一次运行时，文件名便会指向新版文件，旧版的文件则因为引用数量降到0，而被回收。 

> [阮一峰：理解 inode](http://www.ruanyifeng.com/blog/2011/12/inode.html)